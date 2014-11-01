//Methods
//skapar data objektet
module = {}
function generateData(y, x) {
    if (y > 26) {
        throw new Error("Try to keep it below 27 rows.");
    }
    if (y > 10) {
        throw new Error("Try to keep it below 10 columns.")
    }
    var dictionary = createFilledDictionary(y, x);
    return dictionary;
}
//skapar en fylld rad med objekt
function createFilledDictionary(y, x) {
    var dictionary = {};
    for (var i = 0; i < y; i++) {
        dictionary[getLetter(i)] = createEmptyArray(x);
    }
    return dictionary;
}
//skapar en rad med tomma strängar
function createEmptyArray(size) {
    var array = [];
    for (var i = 0; i < size; i++) {
        //måste pusha tomma strängar för att angular har live bindings,
        //om vi pushar null objekt vet inte angular vilket null objekt som uppdateras tror jag.
        array.push(new String());
    }
    return array;
}
//hämtar en bokstav, 0=A, 1=B
function getLetter(i) {
    return String.fromCharCode(65 + i);
}
function clearx(d) {
    for (var k in d) {
        for (var i = 0; i < d[k].length; i++) {
            console.log(k,i);
            d[k][i]=new String();
        }
    };
    return d;
}
//Angular stuffs
var app = angular.module("LARD", []);

var y = 3;
var x = 5;
var _data = { data: generateData(y, x) };

memorySlot={};
memorySlot.num=0;
//Gammalt 2d trick, göra om ett värde till ett kordinat värde.
function freeXY() {
    if (memorySlot.num >= x*y) {
        alert("Minnet är fullt. Jag kan inte tänka på så många saker samtidigt!!! Aaargh!");
        throw new Error("MEMORY FULL!!!!");
    }
    var xx = parseInt(memorySlot.num / parseInt(y));
    var yy = memorySlot.num % parseInt(y);
    var s = getLetter(yy)+xx;
    memorySlot.num++;

    return s;
}
//console.log(_data);

//data service
app.factory("dataService", function ($timeout) {
    return {
        console:[],
        consoleLog : function (log) {
            this.console.unshift(new String(log));
        },
        "dataPlaceStore": function (key, callback, value,type) {
            this.consoleLog("Jag tittar nu direkt i minnet om jag kan hitta värdet vid platsen du angivit.");
            var _this=this;
            key=key.toUpperCase();
            var char = key.substring(0, 1);
            var columnNum = key.substring(1, 2);
            var row = _data.data[char];
            if (row) {
                if (columnNum < row.length && columnNum >=0 && columnNum != "") {
                    if (value || value==0) {
                        var data;
                        this.consoleLog("Jag lagrar nu värdet (" + value + ") i " + key);
                        if (type=="int") {
                            data = parseInt(value);
                        } else if (type=="double") {
                            data = parseFloat(value);
                        } else {
                            data = value;
                        }
                        console.log(char,columnNum);
                        row[columnNum] = data;
                        callback();
                        return;
                    } else {
                        $timeout(function() {
                            _this.consoleLog("Hämtade värdet för " + key + " det är: " + row[columnNum]);
                            var data;
                            if (type=="int") {
                                data = parseInt(row[columnNum]);
                            } else if (type=="double") {
                                data = parseFloat(row[columnNum]);
                            } else {
                                data = row[columnNum];
                            }
                            callback(row[columnNum]);
                        }, 500);
                        return;
                    }
                }
            }

            $timeout(function() {
                _this.consoleLog("Platsen du försöker komma åt finns inte tyvärr. " +
                    "Du kan be mig komma ihåg platsen med double,int eller names!");
                callback("ERROR");
                }
                , 500
            );
        },
        "data": _data,
        "mappers": {
            "alex": {
                "location": "a0",
                "type": "names"}
        },
        "map":function(remember,callback){
            var _this = this;
            console.log(_this.mappers)

            for(var i=0; i<remember[1].length; i++) {
                var rem;
                if (remember[0]=="int") {
                   rem = remember[1][i][1];
                } else if (remember[0] == "double") {
                    rem = remember[1][i][1];
                } else {
                    rem = remember[1][i][1];
                }
                try {
                    _this.consoleLog("Försöker komma ihåg!");
                    _this.mappers[rem] = {
                        location: freeXY(), "type":remember[0] }
                } catch(err) {

                }
            }
            $timeout(function() {
                _this.consoleLog("Detta kommer jag komma ihåg!");
                callback();
            },500);
        },
        "store": function (key, callback, value) {
            var _this=this;
            this.consoleLog("Jag tittar nu hur du försöker lagra ditt värde.");
            //console.log(key);
            //console.log(this.mappers[key]);
            if (this.mappers[key]) {
                $timeout(function () {
                    _this.consoleLog("Jag hittade en platsen genom min karta, nu ska jag ta fram värdet.");
                    _this.dataPlaceStore(_this.mappers[key].location,function() {
                        callback.apply(this,arguments);
                    },value,_this.mappers[key].type);
                }, 500);
            } else {
                $timeout(function () {
                    _this.consoleLog("Du angav en direkt address i minnet, " +
                        "jag ska försöka komma åt det och hämta det åt dig.");
                    _this.dataPlaceStore(key,function() {
                        callback.apply(this,arguments);
                    },value);
                }, 500);
            }
        },
        "get" : function (key, callback) {
            var _this=this;
            $timeout(function() {
                _this.consoleLog("Jag försöker nu hitta värdet för "+key+" som du vill använda.");
                _this.store(key,function(value) {
                    callback(value);
                });
            },500);

        }
    };
})


//hanterar minnet
app.controller("MemoryController", function ($scope, $timeout, dataService) {
    this.data =  _data;
});


COMMANDSTATES = {
    "PENDING": "glyphicon-none",
    "RUNNING": "glyphicon-arrow-right",
    "SUCCESFUL": "glyphicon-ok",
    "FAILED": "glyphicon-remove"
}


//LardController
//Har hand om programmeringsdelen
app.controller("LardController", function ($scope, dataService) {

    this.programmingCode = "";

    this.temporaryMemory = "";
    this.console = dataService.console;
    this.instructions;
    this.instructionViews = null;
    this.currentInstruction = 0;
    this.runningInstruction;
    this.stepping;
    this.step;
    this.runLater;
    this.startStepping=function() {
    	_this.stepping=true;
    }
    this.resume=function(){
    	_this.stepping=false;
    }
    this.step = function() {
    	var t = _this.runLater;
    	_this.runLater=null;
    	t();

    }
    $timeout = function(x,y) {
    	  if (_this.stepping==true) {
		_this.runLater=x;
	  } else {
	  	setTimeout(function() {
	  		x(); 
	  		$scope.$apply();
	  	},y);
	  }
    }

    var _this = this;
    this.consoleLog = function (log) {
        _this.console.unshift(new String(log));
    }
    this.run = function () {
    	  _this.stepping=false;
        dataService.mappers={};
        memorySlot.num=0;
        _this.currentInstruction = 0;
        _this.error = false;
        dataService.console = [];
        dataService.data = generateData(y, x);
        _this.console = dataService.console;
        _this.consoleLog("Jag går igenom din kod!");
        var commands;
        var commands2;
        try {
            commands = module.parser.parse(_this.programmingCode);
            commands2 = module.parser.parse(_this.programmingCode);
        } catch (err) {
            return alert("Det har skett ett fel!\n\nDetta felet kan uppstå på grund av flera orsaker. "
                + "Den allra vanligaste orsaken är att programmeraren glömt skriva ett semikolon i slutet av raden. "
                + "Om du har flera instruktioner måste dessa vara på varsin rad.\n\n"
                + "Det kan även vara så att du skrivit syntaxen fel!\n\n"
                + "Syntax:\n\n"
                + "Tilldelning:\n<namn> <- <värde>;\nExempel:h4<-5+5+h6;\n\n"
                + "Kom ihåg namn(Ha med ett semikolon i slutet):\n<typ> <första namnet>,[ett annat namn osv...];\nExempel:names a,b,c;\nAlternativ: double,int,names\n\n"
                + "Skriv ut:\ntell_me [värde/eller ett namn som vi kommit ihåg];\nExempel: tell_me h4;\n\n");
        }
	 function traverseArr(x) {
		var str="";
		if (Array.isArray(x)) {
			for (var i=0; i<x.length;i++) {
				str+=traverseArr(x[i]);
			}
		} else {
    			return x+" ";
    		}
    		return str+" ";
        }
        _this.instructionViews = [];
        //visa i views
        for (var i = 0; i < commands2.length; i++) {
        	console.log(commands2[i]);

        	var flattenedString=traverseArr(commands2[i]).trim();
            //new string angular bug
            _this.instructionViews.push(
                {
                    data: new String(flattenedString),
                    state: COMMANDSTATES.PENDING
                });
        }        ;

        //gör om denna arrayen av strängar till en array av objekt
        _this.instructions = commands;
        _this.consoleLog("Jag har hittat " + commands.length + " instruktion(er) att köra!");
        if (_this.instructions.length != 0) {
            $timeout(_this.startInterpreting, 500);
        } else {
            _this.instructions = null;
        }

    };

    this.startInterpreting = function () {
        var instructionView = _this.instructionViews[_this.currentInstruction];
        _this.consoleLog("jag kör nu instruktion nr: " + (_this.currentInstruction + 1));
        var instruction = _this.instructions[_this.currentInstruction];
        _this.runningInstruction = instructionView.data;
        instructionView.state = COMMANDSTATES.RUNNING;
        _this.executeCommand(instruction, instructionView);
    }
    this.executeCommand = function (instruction, instructionView) {
        //<mem> <- <värde>
        //method <mem>
        //names <mem1>[,mem,...]


        _this.interpret(_this, $timeout, instruction, dataService);


    }
    //indirection
    this.runNext = function () {
        //  fake for loop
        if ((_this.currentInstruction < _this.instructions.length - 1)) {
            _this.currentInstruction++;
            $timeout(_this.startInterpreting, 500);
        } else {
            //done
            _this.runningInstruction = null;
            _this.consoleLog("Jag är klar och det ser ut som det gått bra utan större fel!");

        }
    }
    this.fail=function() {
        var instructionView = _this.instructionViews[_this.currentInstruction];
        instructionView.state = COMMANDSTATES.FAILED;
        _this.consoleLog("Något gick inte så bra! :/");
        _this.error=true;
    }
    this.interpret = function (_this, $timeout, instruction, dataService) {
        _this.runInstr(instruction, function () {
            $timeout(function () {
                var instructionView = _this.instructionViews[_this.currentInstruction];
                instructionView.state = COMMANDSTATES.SUCCESFUL;
                _this.consoleLog("jag har nu kört klart instruktion nr: " + (_this.currentInstruction + 1));
                _this.runNext();
            }, 500);
        });

    }
    this.runInstr = function (instruction, callback) {
        ////console.log(_data);
        var instr = instruction.shift();
        _this.funcs[instr](instruction, function () {
            callback.apply(this, arguments);
            ////console.log(_data);
            //$scope.$apply();
        });
    }

    //Interpreter
    this.memory = {
        "get": function (key, callback) {
            $timeout(function() {
            _this.consoleLog("Försöker kommunicera med lagringsenheten");

            return dataService.get(key,function (value) {
                if (value)
                    callback(value);
                else {
                    _this.consoleLog("Minnesaddressen du försökte komma var tom!");
                    _this.fail();
                }
            });},500)
        },
        "set":function(key,callback,value) {
            _this.consoleLog("Försöker lagra i lagringsenheten");
            _this.math(value,function(value) {

                $timeout(function () {
                    dataService.store(key[1], function (err) {
                        if(err=="ERROR") {
                            return _this.fail();
                        }
                        callback();
                    },value);
                }, 500)
            });
        },
        "reserve":function(arr,callback) {
            dataService.map(arr,function(err) {
                if (err=="ERROR") {
                    return _this.fail();
                }
                callback();
            })
        }
    }

    this.math = function (arr, callback) {
        ////console.log("running math", arr);
        $timeout(function () {
            if (arr[0] == "DOUBLE") {
                ////console.log("making callback and returning " + parseFloat(arr[1]));
                callback(parseFloat(arr[1]));
            } else if (arr[0] == "INTEGER") {
                callback(parseInt(arr[1]));
            } else if (arr[0] == "STRING") {
            	   callback(arr[1]);
            } else {
                    _this.runInstr(arr, function () {
                        callback.apply(this, arguments);
                    }, 500)
            };

        }, 300);
    }
    this.proxy = function (arr, callback) {
        _this.math(arr[0], function (left) {
            _this.consoleLog("Hämtar första värdet " + left);
            _this.math(arr[1], function (right) {
                _this.consoleLog("Hämtar andra värdet " + right);
                callback(left, right);
            });
        });
    };
    this.multiply = function (arr, callback) {
        _this.proxy(arr, function (left, right) {
            _this.consoleLog("Multiplicerar " + left + " och " + right + " till " + (left * right));
            callback(left * right);
        });
    }

    this.addition = function (arr, callback) {
        _this.proxy(arr, function (left, right) {
            _this.consoleLog("Lägger ihop värden " + left + " och " + right + " till " + (left + right));
            callback(left + right);
        });
    }

    this.subtraction = function (arr, callback) {
        _this.proxy(arr, function (left, right) {
            _this.consoleLog("Tar bort " + right + " från " + left + " och slutsumman blir " + (left - right));
            callback(left - right);
        });
    }

    this.division = function (arr, callback) {
        _this.proxy(arr, function (left, right) {
            _this.consoleLog("Dividerar " + left + " med " + right + " och slutsumman blir " + (left / right));
            callback(left / right);
        });
    }

    this.modulus = function (arr, callback) {
        _this.proxy(arr, function (left, right) {
            _this.consoleLog("Ger resten från divisionen " + right + " / " + left + " och resten är " + (left % right));
            callback(left - right);
        });
    }

    this.datatype = function (arr, callback) {
        _this.memory.reserve(arr,callback);
    }
    this.memorylocation = function (arr, callback) {
        _this.consoleLog("Börjar försöka komma åt "+arr[0]+" i minnet.");
        _this.memory.get(arr[0],function(value) {
            callback(value);
        });
    }
    this.assign = function(arr,callback) {
        _this.memory.set(arr[0],function() { callback(); },arr[1]);
    };
    this.tell_me = function(arr,callback,i) {
    	 _this.consoleLog("Du har bett mig visa saker!");
    	 console.log(i,arr.length,arr);
    	 if (i==undefined){ 
    	 	i=0; 
    	 }
	 if (i < arr[0].length) {
        _this.math(arr[0][i], function (left) {
            _this.consoleLog("hittade värdet och jag ska strax visa det!");
    	     alert(left);
    	     _this.tell_me(arr,callback,i+1);
    	 });
       } else {
       	_this.consoleLog("nu har jag skrivit ut allt du vill!");
    	     	return callback();
	}

    }
    this.string = function(arr,callback) {
        console.log(arr);
        callback(arr[0]);
    };
    this.funcs = {
        "DATATYPE":this.datatype,
        "TELL_ME":this.tell_me,
        "STRING":this.string,
        "INTEGER":this.string,
        "DOUBLE":this.string,
        "MEMORYLOCATION": this.memorylocation,
        "ASSIGN": this.assign,
        "MULTIPLY": this.multiply,
        "ADDITION": this.addition,
        "SUBTRACTION": this.subtraction,
        "DIVISION": this.division,
        "MODULUS": this.modulus
    }


});












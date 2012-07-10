// Generated by CoffeeScript 1.3.3
(function() {
  var defaultRules, name, node, _ref;

  _ref = require('./nodes');
  for (name in _ref) {
    node = _ref[name];
    global[name in global ? "CS" + name : name] = node;
  }

  this.Optimiser = (function() {

    function Optimiser() {
      var applicableCtors, ctor, handler, _i, _j, _len, _len1, _ref1;
      this.rules = {};
      for (_i = 0, _len = defaultRules.length; _i < _len; _i++) {
        _ref1 = defaultRules[_i], applicableCtors = _ref1[0], handler = _ref1[1];
        for (_j = 0, _len1 = applicableCtors.length; _j < _len1; _j++) {
          ctor = applicableCtors[_j];
          this.addRule(ctor.prototype.className, handler);
        }
      }
    }

    Optimiser.prototype.addRule = function(ctor, handler) {
      var _base, _ref1;
      ((_ref1 = (_base = this.rules)[ctor]) != null ? _ref1 : _base[ctor] = []).push(handler);
    };

    Optimiser.prototype.optimise = function(ast) {
      var rules;
      rules = this.rules;
      return ast.walk(function(inScope, ancestry) {
        var memo, rule, _i, _len, _ref1, _ref2;
        memo = this;
        _ref2 = (_ref1 = rules[this.className]) != null ? _ref1 : [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          rule = _ref2[_i];
          memo = rule.call(memo, inScope, ancestry);
        }
        return memo;
      });
    };

    return Optimiser;

  })();

  defaultRules = [
    [
      [Block], function(inScope, ancestors) {
        var newNode,
          _this = this;
        newNode = new Block((function() {
          var canDropLast, i, s, _i, _len, _ref1, _ref2, _results;
          canDropLast = ((_ref1 = ancestors[0]) != null ? _ref1.className : void 0) === 'Program';
          _ref2 = _this.statements;
          _results = [];
          for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
            s = _ref2[i];
            if ((!s.mayHaveSideEffects(inScope)) && (canDropLast || i + 1 !== _this.statements.length)) {
              continue;
            }
            _results.push(s);
          }
          return _results;
        })());
        if (newNode.statements.length === this.statements.length) {
          return this;
        } else {
          return newNode.r(this.raw).p(this.line, this.column);
        }
      }
    ], [
      [SeqOp], function(inScope, ancestors) {
        if (!this.left.mayHaveSideEffects(inScope)) {
          return this.right;
        }
        return this;
      }
    ], [
      [While], function(inScope) {
        if (this.condition.isFalsey()) {
          if (this.condition.mayHaveSideEffects(inScope)) {
            return this.condition;
          } else {
            return (new Null).g();
          }
        }
        if (this.condition.isTruthy()) {
          if (!this.condition.mayHaveSideEffects(inScope)) {
            if (this instanceof Loop) {
              return this;
            }
            return (new Loop(this.block)).g().r(this.raw).p(this.line, this.column);
          }
        }
        return this;
      }
    ], [
      [ForIn], function() {
        if (!(this.expr.className === 'ArrayInitialiser' && this.expr.members.length === 0)) {
          return this;
        }
        return (new ArrayInitialiser([])).g().r(this.raw).p(this.line, this.column);
      }
    ], [
      [ForOf], function() {
        if (!(this.expr.className === 'ObjectInitialiser' && this.expr.isOwn && this.expr.members.length === 0)) {
          return this;
        }
        return (new ArrayInitialiser([])).g().r(this.raw).p(this.line, this.column);
      }
    ], [
      [DoOp], function() {
        var args, param;
        args = [];
        if (this.expr.className === 'Function') {
          args = (function() {
            var _i, _len, _ref1, _results;
            _ref1 = this.expr.parameters;
            _results = [];
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              param = _ref1[_i];
              switch (param.className) {
                case 'AssignOp':
                  _results.push(param.expr);
                  break;
                case 'Identifier':
                case 'MemberAccessOp':
                  _results.push(param);
                  break;
                default:
                  _results.push((new Undefined).g());
              }
            }
            return _results;
          }).call(this);
        }
        return (new FunctionApplication(this.expr, args)).g().p(this.line, this.column);
      }
    ], [
      [LogicalNotOp], function() {
        var newNode;
        newNode = (function() {
          switch (this.expr.className) {
            case 'Int':
            case 'Float':
            case 'String':
            case 'Bool':
              return (new Bool(!this.expr.data)).g();
            case 'Function':
            case 'BoundFunction':
              return (new Bool(false)).g();
            case 'Null':
            case 'Undefined':
              return (new Bool(true)).g();
            case 'ArrayInitialiser':
            case 'ObjectInitialiser':
              if (this.expr.mayHaveSideEffects()) {
                return this;
              } else {
                return (new Bool(false)).g();
              }
              break;
            case 'LogicalNotOp':
              if (this.expr.expr.className === 'LogicalNotOp') {
                return this.expr.expr;
              } else {
                return this;
              }
              break;
            default:
              return this;
          }
        }).call(this);
        if (newNode === this) {
          return this;
        }
        return newNode.r(this.raw).p(this.line, this.column);
      }
    ]
  ];

}).call(this);
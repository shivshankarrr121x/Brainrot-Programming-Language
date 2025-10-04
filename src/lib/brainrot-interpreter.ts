// BrainRot Programming Language Interpreter
// Because chaos can still be computation

export interface Token {
  type: 'KEYWORD' | 'IDENTIFIER' | 'NUMBER' | 'STRING' | 'OPERATOR' | 'DELIMITER' | 'EOF';
  value: string;
  line: number;
  column: number;
}

export interface BrainRotError {
  message: string;
  line: number;
  column: number;
  type: 'SYNTAX' | 'RUNTIME' | 'TYPE';
}

// AST Node Types
export interface ASTNode {
  type: string;
}

export interface VariableDeclaration extends ASTNode {
  type: 'VariableDeclaration';
  name: string;
  value: Expression;
}

export interface PrintStatement extends ASTNode {
  type: 'PrintStatement';
  expression: Expression;
}

export interface Expression extends ASTNode {
  type: 'BinaryExpression' | 'UnaryExpression' | 'Literal' | 'Identifier' | 'CallExpression';
}

export interface UnaryExpression extends Expression {
  type: 'UnaryExpression';
  operator: string;
  operand: Expression;
}

export interface BinaryExpression extends Expression {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface Literal extends Expression {
  type: 'Literal';
  value: any;
}

export interface Identifier extends Expression {
  type: 'Identifier';
  name: string;
}

export interface WhileLoop extends ASTNode {
  type: 'WhileLoop';
  condition: Expression;
  body: ASTNode[];
}

export interface IfStatement extends ASTNode {
  type: 'IfStatement';
  condition: Expression;
  thenBody: ASTNode[];
  elseBody?: ASTNode[];
}

export interface FunctionDeclaration extends ASTNode {
  type: 'FunctionDeclaration';
  name: string;
  parameters: string[];
  body: ASTNode[];
}

export interface CallExpression extends Expression {
  type: 'CallExpression';
  name: string;
  arguments: Expression[];
}

export class BrainRotTokenizer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  private keywords = new Map([
    ['mold', 'MOLD'],
    ['rott', 'ROTT'],
    ['spin', 'SPIN'],
    ['ifrot', 'IFROT'],
    ['elsed', 'ELSED'],
    ['fnrot', 'FNROT'],
    ['androt', 'ANDROT'],
    ['orrot', 'ORROT'],
    ['notrot', 'NOTROT'],
    ['retrot', 'RETROT'],
  ]);

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.position < this.input.length) {
      this.skipWhitespace();
      
      if (this.position >= this.input.length) break;
      
      // Comments
      if (this.peek() === '#' && this.peek(1) === 'r' && this.peek(2) === 'o' && this.peek(3) === 't') {
        this.skipComment();
        continue;
      }
      
      const token = this.nextToken();
      if (token) tokens.push(token);
    }
    
    tokens.push({ type: 'EOF', value: '', line: this.line, column: this.column });
    return tokens;
  }

  private nextToken(): Token | null {
    const char = this.peek();
    const line = this.line;
    const column = this.column;

    // Numbers
    if (char >= '0' && char <= '9') {
      return this.readNumber(line, column);
    }

    // Strings
    if (char === '"' || char === "'") {
      return this.readString(line, column);
    }

    // Identifiers and keywords
    if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_') {
      return this.readIdentifier(line, column);
    }

    // Operators and delimiters
    const operators: Record<string, string> = {
      '+': 'PLUS',
      '-': 'MINUS', 
      '*': 'MULTIPLY',
      '/': 'DIVIDE',
      '=': 'ASSIGN',
      '>': 'GT',
      '<': 'LT',
      '!': 'NOT',
      '(': 'LPAREN',
      ')': 'RPAREN',
      '{': 'LBRACE',
      '}': 'RBRACE',
      ';': 'SEMICOLON',
      ',': 'COMMA',
    };

    // Check for multi-character operators
    if (char === '=' && this.peek(1) === '=') {
      this.advance();
      this.advance();
      return { type: 'OPERATOR', value: 'EQ', line, column };
    }

    if (char === '!' && this.peek(1) === '=') {
      this.advance();
      this.advance();
      return { type: 'OPERATOR', value: 'NEQ', line, column };
    }

    if (operators[char]) {
      this.advance();
      return {
        type: operators[char].includes('PAREN') || operators[char].includes('BRACE') || 
              operators[char] === 'SEMICOLON' || operators[char] === 'COMMA' ? 'DELIMITER' : 'OPERATOR',
        value: operators[char],
        line,
        column
      };
    }

    // Unknown character
    this.advance();
    return null;
  }

  private readNumber(line: number, column: number): Token {
    let value = '';
    let hasDot = false;
    
    while (this.position < this.input.length) {
      const char = this.peek();
      if (char >= '0' && char <= '9') {
        value += char;
        this.advance();
      } else if (char === '.' && !hasDot) {
        hasDot = true;
        value += char;
        this.advance();
      } else {
        break;
      }
    }
    
    return { type: 'NUMBER', value, line, column };
  }

  private readString(line: number, column: number): Token {
    const quote = this.peek();
    this.advance(); // Skip opening quote
    
    let value = '';
    while (this.position < this.input.length && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance();
        const escaped = this.peek();
        switch (escaped) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case 'r': value += '\r'; break;
          case '\\': value += '\\'; break;
          case quote: value += quote; break;
          default: value += escaped; break;
        }
      } else {
        value += this.peek();
      }
      this.advance();
    }
    
    if (this.peek() === quote) {
      this.advance(); // Skip closing quote
    }
    
    return { type: 'STRING', value, line, column };
  }

  private readIdentifier(line: number, column: number): Token {
    let value = '';
    
    while (this.position < this.input.length) {
      const char = this.peek();
      if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || 
          (char >= '0' && char <= '9') || char === '_') {
        value += char;
        this.advance();
      } else {
        break;
      }
    }
    
    const keyword = this.keywords.get(value.toLowerCase());
    return {
      type: keyword ? 'KEYWORD' : 'IDENTIFIER',
      value: keyword || value,
      line,
      column
    };
  }

  private peek(offset: number = 0): string {
    const pos = this.position + offset;
    return pos < this.input.length ? this.input[pos] : '';
  }

  private advance(): void {
    if (this.position < this.input.length) {
      if (this.input[this.position] === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.position++;
    }
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length && 
           [' ', '\t', '\n', '\r'].includes(this.input[this.position])) {
      this.advance();
    }
  }

  private skipComment(): void {
    while (this.position < this.input.length && this.input[this.position] !== '\n') {
      this.advance();
    }
  }
}

export class BrainRotParser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode[] {
    const statements: ASTNode[] = [];
    
    while (!this.isAtEnd()) {
      try {
        const stmt = this.statement();
        if (stmt) statements.push(stmt);
      } catch (error) {
        // Skip to next statement on error
        this.synchronize();
      }
    }
    
    return statements;
  }

  private statement(): ASTNode | null {
    if (this.match('KEYWORD', 'MOLD')) {
      return this.variableDeclaration();
    }
    if (this.match('KEYWORD', 'ROTT')) {
      return this.printStatement();
    }
    if (this.match('KEYWORD', 'SPIN')) {
      return this.whileLoop();
    }
    if (this.match('KEYWORD', 'IFROT')) {
      return this.ifStatement();
    }
    if (this.match('KEYWORD', 'FNROT')) {
      return this.functionDeclaration();
    }
    
    // Expression statement
    const expr = this.expression();
    this.consume('DELIMITER', 'SEMICOLON', 'Expected ; after expression');
    return expr;
  }

  private variableDeclaration(): VariableDeclaration {
    const name = this.consume('IDENTIFIER', '', 'Expected variable name');
    this.consume('OPERATOR', 'ASSIGN', 'Expected = after variable name');
    const value = this.expression();
    this.consume('DELIMITER', 'SEMICOLON', 'Expected ; after variable declaration');
    
    return {
      type: 'VariableDeclaration',
      name: name.value,
      value
    };
  }

  private printStatement(): PrintStatement {
    const expression = this.expression();
    this.consume('DELIMITER', 'SEMICOLON', 'Expected ; after print statement');
    
    return {
      type: 'PrintStatement',
      expression
    };
  }

  private whileLoop(): WhileLoop {
    const condition = this.expression();
    this.consume('DELIMITER', 'LBRACE', 'Expected { after while condition');
    
    const body: ASTNode[] = [];
    while (!this.check('DELIMITER', 'RBRACE') && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) body.push(stmt);
    }
    
    this.consume('DELIMITER', 'RBRACE', 'Expected } after while body');
    
    return {
      type: 'WhileLoop',
      condition,
      body
    };
  }

  private ifStatement(): IfStatement {
    const condition = this.expression();
    this.consume('DELIMITER', 'LBRACE', 'Expected { after if condition');
    
    const thenBody: ASTNode[] = [];
    while (!this.check('DELIMITER', 'RBRACE') && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) thenBody.push(stmt);
    }
    
    this.consume('DELIMITER', 'RBRACE', 'Expected } after if body');
    
    let elseBody: ASTNode[] | undefined;
    if (this.match('KEYWORD', 'ELSED')) {
      this.consume('DELIMITER', 'LBRACE', 'Expected { after else');
      elseBody = [];
      while (!this.check('DELIMITER', 'RBRACE') && !this.isAtEnd()) {
        const stmt = this.statement();
        if (stmt) elseBody.push(stmt);
      }
      this.consume('DELIMITER', 'RBRACE', 'Expected } after else body');
    }
    
    return {
      type: 'IfStatement',
      condition,
      thenBody,
      elseBody
    };
  }

  private functionDeclaration(): FunctionDeclaration {
    const name = this.consume('IDENTIFIER', '', 'Expected function name');
    this.consume('DELIMITER', 'LPAREN', 'Expected ( after function name');
    
    const parameters: string[] = [];
    if (!this.check('DELIMITER', 'RPAREN')) {
      do {
        const param = this.consume('IDENTIFIER', '', 'Expected parameter name');
        parameters.push(param.value);
      } while (this.match('DELIMITER', 'COMMA'));
    }
    
    this.consume('DELIMITER', 'RPAREN', 'Expected ) after parameters');
    this.consume('DELIMITER', 'LBRACE', 'Expected { before function body');
    
    const body: ASTNode[] = [];
    while (!this.check('DELIMITER', 'RBRACE') && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) body.push(stmt);
    }
    
    this.consume('DELIMITER', 'RBRACE', 'Expected } after function body');
    
    return {
      type: 'FunctionDeclaration',
      name: name.value,
      parameters,
      body
    };
  }

  private expression(): Expression {
    return this.logicalOr();
  }

  private logicalOr(): Expression {
    let expr = this.logicalAnd();
    
    while (this.match('KEYWORD', 'ORROT')) {
      const operator = this.previous().value;
      const right = this.logicalAnd();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      } as BinaryExpression;
    }
    
    return expr;
  }

  private logicalAnd(): Expression {
    let expr = this.equality();
    
    while (this.match('KEYWORD', 'ANDROT')) {
      const operator = this.previous().value;
      const right = this.equality();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      } as BinaryExpression;
    }
    
    return expr;
  }

  private equality(): Expression {
    let expr = this.comparison();
    
    while (this.match('OPERATOR', 'EQ') || this.match('OPERATOR', 'NEQ')) {
      const operator = this.previous().value;
      const right = this.comparison();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      } as BinaryExpression;
    }
    
    return expr;
  }

  private comparison(): Expression {
    let expr = this.term();
    
    while (this.match('OPERATOR', 'GT') || this.match('OPERATOR', 'LT')) {
      const operator = this.previous().value;
      const right = this.term();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      } as BinaryExpression;
    }
    
    return expr;
  }

  private term(): Expression {
    let expr = this.factor();
    
    while (this.match('OPERATOR', 'PLUS') || this.match('OPERATOR', 'MINUS')) {
      const operator = this.previous().value;
      const right = this.factor();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      } as BinaryExpression;
    }
    
    return expr;
  }

  private factor(): Expression {
    let expr = this.unary();
    
    while (this.match('OPERATOR', 'MULTIPLY') || this.match('OPERATOR', 'DIVIDE')) {
      const operator = this.previous().value;
      const right = this.unary();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      } as BinaryExpression;
    }
    
    return expr;
  }

  private unary(): Expression {
    if (this.match('OPERATOR', 'NOT') || this.match('KEYWORD', 'NOTROT') || this.match('OPERATOR', 'MINUS')) {
      const operator = this.previous().value;
      const right = this.unary();
      return {
        type: 'UnaryExpression',
        operator,
        operand: right
      } as any;
    }
    
    return this.call();
  }

  private call(): Expression {
    let expr = this.primary();
    
    while (this.match('DELIMITER', 'LPAREN')) {
      expr = this.finishCall(expr);
    }
    
    return expr;
  }

  private finishCall(callee: Expression): CallExpression {
    const args: Expression[] = [];
    
    if (!this.check('DELIMITER', 'RPAREN')) {
      do {
        args.push(this.expression());
      } while (this.match('DELIMITER', 'COMMA'));
    }
    
    this.consume('DELIMITER', 'RPAREN', 'Expected ) after arguments');
    
    return {
      type: 'CallExpression',
      name: (callee as Identifier).name,
      arguments: args
    };
  }

  private primary(): Expression {
    if (this.match('NUMBER')) {
      const value = this.previous().value;
      return {
        type: 'Literal',
        value: value.includes('.') ? parseFloat(value) : parseInt(value)
      } as Literal;
    }
    
    if (this.match('STRING')) {
      return {
        type: 'Literal',
        value: this.previous().value
      } as Literal;
    }
    
    if (this.match('IDENTIFIER')) {
      return {
        type: 'Identifier',
        name: this.previous().value
      } as Identifier;
    }
    
    if (this.match('DELIMITER', 'LPAREN')) {
      const expr = this.expression();
      this.consume('DELIMITER', 'RPAREN', 'Expected ) after expression');
      return expr;
    }
    
    throw new Error(`Unexpected token: ${this.peek().value}`);
  }

  private match(...types: string[]): boolean {
    for (let i = 0; i < types.length; i += 2) {
      if (this.check(types[i], types[i + 1])) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: string, value?: string): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    return token.type === type && (value === undefined || token.value === value);
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.position++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.position];
  }

  private previous(): Token {
    return this.tokens[this.position - 1];
  }

  private consume(type: string, value: string, message: string): Token {
    if (value === '') {
      // Just check type, not value
      if (this.peek().type === type) return this.advance();
    } else {
      if (this.check(type, value)) return this.advance();
    }
    
    const current = this.peek();
    throw new Error(`${message} at line ${current.line}, column ${current.column}`);
  }

  private synchronize(): void {
    this.advance();
    
    while (!this.isAtEnd()) {
      if (this.previous().value === 'SEMICOLON') return;
      
      if (['MOLD', 'ROTT', 'SPIN', 'IFROT', 'FNROT'].includes(this.peek().value)) {
        return;
      }
      
      this.advance();
    }
  }
}

export class BrainRotInterpreter {
  private variables = new Map<string, any>();
  private functions = new Map<string, FunctionDeclaration>();
  private output: string[] = [];

  interpret(ast: ASTNode[]): { output: string[], error?: BrainRotError } {
    this.output = [];
    
    try {
      for (const node of ast) {
        this.execute(node);
      }
      return { output: this.output };
    } catch (error: any) {
      return {
        output: this.output,
        error: {
          message: `Brain rot detected: ${error.message}`,
          line: 0,
          column: 0,
          type: 'RUNTIME'
        }
      };
    }
  }

  private execute(node: ASTNode): any {
    switch (node.type) {
      case 'VariableDeclaration':
        const varDecl = node as VariableDeclaration;
        const value = this.evaluate(varDecl.value);
        this.variables.set(varDecl.name, value);
        return value;
        
      case 'PrintStatement':
        const printStmt = node as PrintStatement;
        const result = this.evaluate(printStmt.expression);
        this.output.push(String(result));
        return result;
        
      case 'WhileLoop':
        const whileLoop = node as WhileLoop;
        while (this.isTruthy(this.evaluate(whileLoop.condition))) {
          for (const stmt of whileLoop.body) {
            this.execute(stmt);
          }
        }
        return null;
        
      case 'IfStatement':
        const ifStmt = node as IfStatement;
        if (this.isTruthy(this.evaluate(ifStmt.condition))) {
          for (const stmt of ifStmt.thenBody) {
            this.execute(stmt);
          }
        } else if (ifStmt.elseBody) {
          for (const stmt of ifStmt.elseBody) {
            this.execute(stmt);
          }
        }
        return null;
        
      case 'FunctionDeclaration':
        const funcDecl = node as FunctionDeclaration;
        this.functions.set(funcDecl.name, funcDecl);
        return null;
        
      default:
        return this.evaluate(node as Expression);
    }
  }

  private evaluate(expr: Expression): any {
    switch (expr.type) {
      case 'Literal':
        return (expr as Literal).value;
        
      case 'Identifier':
        const identifier = expr as Identifier;
        if (this.variables.has(identifier.name)) {
          return this.variables.get(identifier.name);
        }
        throw new Error(`Undefined variable: ${identifier.name}`);
        
      case 'BinaryExpression':
        const binExpr = expr as BinaryExpression;
        const left = this.evaluate(binExpr.left);
        const right = this.evaluate(binExpr.right);
        
        switch (binExpr.operator) {
          case 'PLUS': return left + right;
          case 'MINUS': return left - right;
          case 'MULTIPLY': return left * right;
          case 'DIVIDE': return left / right;
          case 'GT': return left > right;
          case 'LT': return left < right;
          case 'EQ': return left === right;
          case 'NEQ': return left !== right;
          case 'ANDROT': return this.isTruthy(left) && this.isTruthy(right);
          case 'ORROT': return this.isTruthy(left) || this.isTruthy(right);
          default:
            throw new Error(`Unknown operator: ${binExpr.operator}`);
        }
        
      case 'CallExpression':
        const callExpr = expr as CallExpression;
        const func = this.functions.get(callExpr.name);
        if (!func) {
          throw new Error(`Undefined function: ${callExpr.name}`);
        }
        
        // Create new scope for function
        const prevVars = new Map(this.variables);
        
        // Bind parameters
        for (let i = 0; i < func.parameters.length; i++) {
          const paramValue = i < callExpr.arguments.length ? 
            this.evaluate(callExpr.arguments[i]) : undefined;
          this.variables.set(func.parameters[i], paramValue);
        }
        
        // Execute function body
        let result;
        for (const stmt of func.body) {
          result = this.execute(stmt);
        }
        
        // Restore previous scope
        this.variables = prevVars;
        return result;
        
      default:
        throw new Error(`Unknown expression type: ${expr.type}`);
    }
  }

  private isTruthy(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    return true;
  }

  getOutput(): string[] {
    return this.output;
  }

  clearVariables(): void {
    this.variables.clear();
    this.functions.clear();
  }
}

export function executeBrainRot(code: string): { output: string[], error?: BrainRotError } {
  try {
    const tokenizer = new BrainRotTokenizer(code);
    const tokens = tokenizer.tokenize();
    
    const parser = new BrainRotParser(tokens);
    const ast = parser.parse();
    
    const interpreter = new BrainRotInterpreter();
    return interpreter.interpret(ast);
  } catch (error: any) {
    return {
      output: [],
      error: {
        message: `Syntax rotted too hard: ${error.message}`,
        line: 0,
        column: 0,
        type: 'SYNTAX'
      }
    };
  }
}
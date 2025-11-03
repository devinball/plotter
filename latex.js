import * as math from 'mathjs';
import { parseTex } from 'tex-math-parser';

/**
 * Scope Manager for LaTeX expressions with mathjs
 * Handles variable and function definitions in LaTeX syntax
 */
export class LaTeXScopeManager {
  constructor() {
    this.scope = {};
    this.functions = {};
  }

  /**
   * Define a variable from LaTeX
   * Example: "x = 5" or "y = 2x + 3"
   */
  defineVariable(latexDefinition) {
    // Parse the LaTeX definition
    const parts = latexDefinition.split('=').map(s => s.trim());
    if (parts.length !== 2) {
      throw new Error('Variable definition must be in format: variable = expression');
    }

    const varName = parts[0];
    const expression = parts[1];

    // Validate variable name (simple identifier)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
      throw new Error(`Invalid variable name: ${varName}`);
    }

    // Parse and evaluate the expression
    const value = this.evaluate(expression);
    this.scope[varName] = value;

    return value;
  }

  /**
   * Define a function from LaTeX
   * Example: "f(x) = x^2 + 1" or "g(x, y) = \frac{x + y}{2}"
   */
  defineFunction(latexDefinition) {
    // Parse function definition: name(params) = expression
    const match = latexDefinition.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]+)\)\s*=\s*(.+)$/);
    
    if (!match) {
      throw new Error('Function definition must be in format: f(x, y, ...) = expression');
    }

    const funcName = match[1];
    const params = match[2].split(',').map(p => p.trim());
    const expression = match[3];

    // Validate parameter names
    for (const param of params) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param)) {
        throw new Error(`Invalid parameter name: ${param}`);
      }
    }

    // Store the function definition
    this.functions[funcName] = {
      params,
      expression,
      compiled: null
    };

    // Create a mathjs function that can be used in the scope
    this.scope[funcName] = (...args) => {
      if (args.length !== params.length) {
        throw new Error(`Function ${funcName} expects ${params.length} arguments, got ${args.length}`);
      }

      // Create a temporary scope with the parameter values
      const tempScope = { ...this.scope };
      params.forEach((param, i) => {
        tempScope[param] = args[i];
      });

      // Evaluate the function expression with the parameter scope
      return this.evaluate(expression, tempScope);
    };

    return this.scope[funcName];
  }

  /**
   * Evaluate a LaTeX expression
   */
  evaluate(latexExpression, customScope = null) {
    const scopeToUse = customScope || this.scope;

    try {
      // Parse LaTeX to mathjs AST
      const parsed = parseTex(latexExpression);
      
      // Convert to mathjs expression and evaluate
      const result = parsed.evaluate(scopeToUse);
      
      return result;
    } catch (error) {
      throw new Error(`Failed to evaluate expression "${latexExpression}": ${error.message}`);
    }
  }

  /**
   * Get a variable value
   */
  getVariable(name) {
    if (!(name in this.scope)) {
      throw new Error(`Variable ${name} is not defined`);
    }
    return this.scope[name];
  }

  /**
   * Get a function
   */
  getFunction(name) {
    if (!(name in this.functions)) {
      throw new Error(`Function ${name} is not defined`);
    }
    return this.scope[name];
  }

  /**
   * Check if a variable exists
   */
  hasVariable(name) {
    return name in this.scope && !(name in this.functions);
  }

  /**
   * Check if a function exists
   */
  hasFunction(name) {
    return name in this.functions;
  }

  /**
   * Delete a variable
   */
  deleteVariable(name) {
    if (name in this.functions) {
      throw new Error(`Cannot delete function ${name} as a variable`);
    }
    delete this.scope[name];
  }

  /**
   * Delete a function
   */
  deleteFunction(name) {
    delete this.functions[name];
    delete this.scope[name];
  }

  /**
   * Clear all variables and functions
   */
  clear() {
    this.scope = {};
    this.functions = {};
  }

  /**
   * Get all variable names
   */
  getVariableNames() {
    return Object.keys(this.scope).filter(name => !(name in this.functions));
  }

  /**
   * Get all function names
   */
  getFunctionNames() {
    return Object.keys(this.functions);
  }

  /**
   * Get the entire scope (for debugging)
   */
  getScope() {
    return { ...this.scope };
  }

  /**
   * Export scope state (for serialization)
   */
  exportState() {
    return {
      variables: this.getVariableNames().reduce((acc, name) => {
        acc[name] = this.scope[name];
        return acc;
      }, {}),
      functions: { ...this.functions }
    };
  }

  /**
   * Import scope state (for deserialization)
   */
  importState(state) {
    this.clear();
    
    // Import variables
    if (state.variables) {
      Object.entries(state.variables).forEach(([name, value]) => {
        this.scope[name] = value;
      });
    }

    // Import functions
    if (state.functions) {
      Object.entries(state.functions).forEach(([name, func]) => {
        this.functions[name] = func;
        // Recreate the function in scope
        const { params, expression } = func;
        this.scope[name] = (...args) => {
          if (args.length !== params.length) {
            throw new Error(`Function ${name} expects ${params.length} arguments, got ${args.length}`);
          }
          const tempScope = { ...this.scope };
          params.forEach((param, i) => {
            tempScope[param] = args[i];
          });
          return this.evaluate(expression, tempScope);
        };
      });
    }
  }
}

// Example usage:
const scopeManager = new LaTeXScopeManager();

// Define variables
scopeManager.defineVariable('x = 5');
scopeManager.defineVariable('y = 2x + 3'); // Uses previously defined x

// Define functions
scopeManager.defineFunction('f(x) = x^2 + 1');
scopeManager.defineFunction('g(x, y) = \\frac{x + y}{2}');

// Evaluate expressions
console.log(scopeManager.evaluate('f(3)')); // 10
console.log(scopeManager.evaluate('g(x, y)')); // 6.5
console.log(scopeManager.evaluate('f(x) + g(2, 4)')); // 29

// Export and import state
const state = scopeManager.exportState();
console.log('Exported state:', state);

export default LaTeXScopeManager;
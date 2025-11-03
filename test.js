import { ParametricLine3D, Surface3D } from "./plots.js";
import { create, all } from "mathjs";
import { plots } from "./scene.js";

class ExpressionContext {
    constructor() {
        this.expressions = []
    }

    add(expression) {
        this.expressions.push(expression);
    }

    remove(id) {
        const expr = this.expressions.find((e) => e.id == id);

    }

    get(id) {
        this.expressions.forEach(element => {
            if (element.id == id) {
                return id;
            }
        });
    }

    evaluate() {
        const expr = this.expressions.map((e) => { return e.content; });
        try {
            math.evaluate(expr);
        }
        catch {

        }        
    }
}

class Expression {
    id = 0;
    content = "";
    constructor(id, content) {
        this.id = id;
        this.content = content;
    }
}

const expressionContext = new ExpressionContext();

let currentExpressionId = 0;

function newExpression(content) {
    currentExpressionId++;
    return new Expression(currentExpressionId, content)
}

function addExpressionBox() {
    const expression = newExpression("")

    expressionContext.add(expression);

    const container = document.getElementById('expression-list');
    const div = document.createElement('div');
    div.className = 'expression-item';
    div.id = `expression-block-${expression.id}`
    div.innerHTML = `
        <div class="expression-header">
            <div class="expression-controls">
                <button class="secondary small" data-id="${expression.id}" data-action="toggle"></button>
                <button class="danger small" data-id="${expression.id}" data-action="delete">×</button>
            </div>
        </div>
        <!--<math-field class="math-edit-box" id="math-field-${expression.id}" data-id="${expression.id}"></math-field>-->
        <input type="text" class="math-edit-box" id="math-field-${expression.id}">
    `;

    container.appendChild(div);

    document.getElementById(`math-field-${expression.id}`).addEventListener('input',(ev) => {
        expression.content = ev.target.value;
        plots.clear();
        expressionContext.evaluate();
    });
}

const math = create(all, {});

math.import({
    surface_3d: (f, x0 = -10, x1 = 10, y0 = -10, y1 = 10, resolution = 40) => {
        Surface3D(f, x0, x1, y0, y1, resolution);
    },
    parametric_line_3d: (f, t0 = 0, t1 = 10) => {
        ParametricLine3D(f, t0, t1);
    },
    out: (x) => { console.log(x); }
}, { override: true })


// either automatically add sliders to things that look like "c = 1",
// or do something like "c = animate(0, 1, speed=1)"





//expressionContext.add(newExpression("surface_3d(f)"))



document.getElementById('add-expression-button').addEventListener('click', () => {
    addExpressionBox();
});



/*



const a = math.evaluate([
    "c = 0.1",
    "f(x, y) = x*y*c",
    "h(t) = [sin(15t), cos(15t), t]",
    "surface_3d(f)",
    "parametric_line_3d(h)",
]);


console.log(a);
*/

// Use latex lib to conver latex AST into mathjs expression/nodetree, then evaluate and use


/*
const b = math.parse("m = 3").compile().evaluate()
const c = math.parse("f(x, y) = x*y^2").compile().evaluate()(2, 4)
const d = math.parse("x*y^2").compile().evaluate({x: 2, y: 4})



console.log(b, c, d)





// use mathjs, then use toTex to display


const math = math.create(math.all, {})
let scope = {}   // symbol table

for (let line of userText.split('\n')) {
    line = line.trim()
    if (!line) continue

    if (line.includes('=')) {
        // assignment or function
        let [lhs, rhs] = line.split('=').map(s => s.trim())

        if (lhs.includes('(')) {
            // function definition
            let fnName = lhs.slice(0, lhs.indexOf('('))
            // we store a compiled expression
            scope[fnName] = math.parse(rhs).compile()
        } else {
            // variable assignment
            scope[lhs] = math.evaluate(rhs, scope)
        }
    } else {
        // expression or directive
        if (line.startsWith('plot ')) {
            let fn = line.slice(5).trim()
            // caller handles plotting
            plots.push(fn)
        } else {
            // just compute a value
            console.log(math.evaluate(line, scope))
        }
    }
}
*/



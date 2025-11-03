
/*

short version:
it’s absolutely doable — you don’t need desmos source. there are components you can glue together.

---

## the 3 independent problems you need to solve

| piece                          | what you need                                         | examples                                                                    |
| ------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| parse user-typed math into AST | a math parser that yields a function you can evaluate | **mathjs**, **nerdamer**, **expr-eval**                                     |
| evaluate / bind variables      | symbol table / scope                                  | you do it yourself, mathjs helps                                            |
| plotting                       | a 2d graph renderer                                   | **plotly.js**, **uPlot**, **dygraphs**, **jsxgraph**, **two.js**, **p5.js** |

Desmos is basically:

* a math parser + simplifier
* a constraint solver
* a very good renderer
* lots of UX polish

You do *not* need to write everything from scratch.

---

## “closest to desmos” stack that works right now

### 1) renderer: **JSXGraph**

* open source
* geometric + analytic drawing
* works with functions directly
* super performant
  [https://jsxgraph.org/](https://jsxgraph.org/)

JSXGraph is *the only library that is natively “math classroom friendly”*.

### 2) parser + evaluation: **mathjs**

* safe evaluation sandbox
* units
* functions
* allows people to define variables in runtime

```js
import { create, all } from 'mathjs'

const math = create(all, {})

const scope = {}
scope.x = 2
const f = math.parse('sin(3*x)').compile()
console.log(f.evaluate(scope))
```

You can dynamically add user functions:

```js
scope.f = math.parse('x^2 + a').compile()
scope.a = 5
```

then your plotter calls `scope.x = t; f.evaluate(scope)` for each t.

---

## example architecture

```
<input>  user enters:   a = 4
<input>  user enters:   f(x) = sin(a*x)
<input>  user enters:   plot f from  -10  to +10

↓ mathjs parses each line
↓ builds scope table { a:4, f: compiled function }

plotter samples f(x) at 1000 points → feed into JSXGraph
```

You re-render each time scope changes.

---

## alternatives

| part                 | option                                             |
| -------------------- | -------------------------------------------------- |
| parser only          | `expr-eval` (lighter)                              |
| renderer-only        | `Plotly.js` or `uPlot` or `Chart.js`               |
| all-in-one (closest) | **Sage Cell** embed, but that’s python server side |

---

## quickest minimal starter (very real)

* mathjs for “function language”
* JSXGraph for graphing

no servers required.

---

If you want I can write you a 60-line html file:

* text area for definitions
* parse each line
* plot function definitions automatically

just tell me:

### do you want grammar like desmos?

e.g.

```
a=3
f(x)=sin(a*x)
g(x)=x^2
plot f, g
```

or do you want a simpler one where the UI explicitly has separate input fields?


*/

/*
ok — that’s the *right* part to be stuck on
that *is* the whole magic

let me show you the way to structure it so it is not scary

### we do NOT parse like desmos

we do:

**1 line = 1 statement**

types of statements:

| type                      | syntax example    |
| ------------------------- | ----------------- |
| variable assignment       | `a = 3`           |
| function def              | `f(x) = sin(a*x)` |
| expression (value)        | `f(2)`            |
| plot directive (optional) | `plot f`          |

this means you can process line by line — no AST of the whole document needed.

---

### we use mathjs to parse each right-hand side

**the entire scope is just one object**

```js
import { create, all } from 'mathjs'
const math = create(all, {})
let scope = {}   // symbol table
```

---

### algorithm (this is the core)

```js
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
```

that is honestly 80% of a working mini-Desmos.

---

### evaluating functions

for plotting you do something like:

```js
function evalFunction(fnName, x) {
    return scope[fnName].evaluate({ ...scope, x })
}
```

so you temporarily bind x.

---

### what this gives you

user enters:

```
a = 3
f(x) = sin(a*x)
plot f
```

your process loop fills:

```js
scope = {
    a: 3,
    f: compiledExpressionObject
}
plots = ["f"]
```

then your plotter samples `evalFunction("f", t)` for t in domain.

---

### this is the mental model

* mathjs handles syntax + safety + compile
* *you do not write a parser*
* you only write a **1 line splitter** and a **2 branch type checker** (assignment vs expression)

---

### next step

If you want, I can write you a 100% runnable HTML that does exactly this (no plotting yet, just console logs evals) so you can paste in browser and start modifying.

Do you want:

* pure ES modules
  or
* single `<script>` tag with CDN fetch of mathjs?

*/

/*

important distinction:

**LaTeX is a *rendering language*, not an *input language*.**
Desmos uses LaTeX *only to show pretty math*.
Desmos does **not** parse LaTeX as its true internal syntax.

the internal syntax inside Desmos is *almost exactly* JS-ish math:

```
f(x) = sin(3x)
```

they *generate* LaTeX ← from that

---

### so for input:

don’t accept LaTeX

accept plain expression text
(syntax like JS or mathjs)

example input language:

```
a = 3
b = 5
f(x) = sin(a*x) + b
```

### parse that → mathjs

### then render pretty output → KaTeX

KaTeX can take your AST (mathjs nodes) and convert to LaTeX

there is already a connector:

**mathjs → LaTeX**

```js
node.toTex()
```

so you can:

1. user types plain text expression
2. mathjs parses it
3. you show pretty LaTeX via KaTeX

this is actually the standard pattern in open source CAS systems

---

### summary model

| stage                 | tech                       |
| --------------------- | -------------------------- |
| user input            | plain text (mathjs syntax) |
| parsing + evaluation  | mathjs                     |
| output pretty display | KaTeX or MathJax           |
| visualization         | JSXGraph / Plotly / etc    |

---

### if you want “Wolfram-alpha like pretty input”

that’s harder but possible

there are libraries like:
**mathlive** from IFT (open source)

mathlive lets the user type in something that *looks like math*
and gives you a MathJSON AST you can interpret.

but you still don’t execute “LaTeX” directly — you use the AST from mathlive.

---

### the simplest + recommended architecture

**input:** plain editable `<textarea>`
**compute:** mathjs
**render pretty:** KaTeX (using mathjs node.toTex())

this gives you ~95% of the “desmos feel” with minimal pain.

---

so:

> could i do something similar with mathjs?

yes — and you should

**you don’t parse LaTeX — you *generate* LaTeX from mathjs**
and use KaTeX only for display

---

if you want, I can outline the exact flow chart of the text input → AST → scope table → LaTeX render → plot steps as a block diagram.


import { execute, clearScope } from "./expressions"


clearScope();

const exprs = [
    "n = 2",
    "m = 3",
    "g(x, y) = \\frac{x}{y}",
    "h(x, y) = x \\cdot y",
    "f(x, y) = x + y",
    "\\operatorname{surface3d}(f(x,y) - m - n - h(x, y^2))",
    "\\operatorname{surface3d}(g(x,y))",
    "\\operatorname{parametricSurface3d}([(2 + 1 \\cos v) \\cos u, (2 + 1 \\cos v) \\sin u, 1 \\sin v], 0, 2\\pi, 0, 2\\pi)",
    "\\operatorname{parametricLine3d}([\\cos t, \\sin t, \\frac{t}{100}], 0, 200)",
]

exprs.forEach(element => {
    execute(element);
});



//const fn = (x, y) => ce.parse("2x+y").compile()({x: x, y: y});
//console.log(fn, fn(1, 1))
//console.log(ce.parse("2x+y").compile()({x: 1, y: 1}))

// Usage: users type directly
// ce.evaluate("parametric_surface_3d([[\"Multiply\", [\"Cos\", \"u\"], [\"Add\", 2, [\"Cos\", \"v\"]]], [\"Multiply\", [\"Sin\", \"u\"], [\"Add\", 2, [\"Cos\", \"v\"]]], [\"Sin\", \"v\"]], 0, 2*pi, 0, 2*pi)");

//ce.assign("double", ([x]) => x.mul(2));
//console.log(ce.parse("\\operatorname{double}(2)").evaluate().valueOf())

/*
// Register implementations
ce.assign('surface_3d', (expr, x0, x1, y0, y1, resolution = 40) => {
    console.log(expr)
    const f = ce.box(expr).compile();
    Surface3D((x, y) => f({ x, y }), x0, x1, y0, y1, resolution);
});

ce.assign('parametric_line_3d', (expr, t0, t1) => {
    const compiled = ce.box(expr).map(e => ce.box(e).compile());
    ParametricLine3D(t => compiled.map(f => f({ t })), t0, t1);
});

ce.assign('parametric_surface_3d', (expr, u0, u1, v0, v1, resolution = 40) => {
    console.log(expr)
    const compiled = ce.box(expr).map(e => ce.box(e).compile());
    ParametricSurface3D((u, v) => compiled.map(f => f({ u, v })), u0, u1, v0, v1, resolution);
});

ce.assign('point_3d', (expr) => {
    const compiled = ce.box(expr).map(e => ce.box(e).compile());
    Point3D(() => compiled.map(f => f({})));
});
*/

// maybe i should detect if an expression is a function definition
// then give user options to graph it
// it would just create a hidden expression 'linked' to the original

// either automatically add sliders to things that look like "c = 1",
// or do something like "c = animate(0, 1, speed=1)"

//expressionContext.add(newExpression("surface_3d(f)"))

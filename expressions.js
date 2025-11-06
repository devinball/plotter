import {
    ParametricLine3D,
    ParametricSurface3D,
    Point3D,
    Surface3D,
    VectorField3D,
} from "./plots.js";
import { ComputeEngine } from "@cortex-js/compute-engine";
import { plots } from "./scene.js";

const ce = new ComputeEngine();

function declarePlots() {
    ce.declare("surface", {
        signature:
            "(expression, number?, number?, number?, number?, number?) -> any",
        evaluate: ([
            expr,
            x0 = -10,
            x1 = 10,
            y0 = -10,
            y1 = 10,
            resolution = 100,
        ]) => {
            const c = ce.box(expr).compile();
            const f = (x, y) => c({ x: x, y: y });
            Surface3D(f, x0.value, x1.value, y0.value, y1.value, resolution.value);
        },
    });

    ce.declare("parametricline", {
        signature: "(expression, number?, number?) -> any",
        evaluate: ([expr, t0 = ce.parse("0"), t1 = ce.parse("10")]) => {
            const c = ce.box(expr).compile();
            const f = (t) => c({ t: t });
            ParametricLine3D(f, t0.value, t1.value);
        },
    });

    ce.declare("parametricsurface", {
        signature:
            "(expression, number?, number?, number?, number?, number?) -> any",
        evaluate: ([
            expr,
            u0 = -10,
            u1 = 10,
            v0 = -10,
            v1 = 10,
            resolution = 100,
        ]) => {
            const c = ce.box(expr).compile();
            const f = (u, v) => c({ u: u, v: v });
            ParametricSurface3D(
                f,
                u0.value,
                u1.value,
                v0.value,
                v1.value,
                resolution.value
            );
        },
    });

    ce.declare("vectorfield", {
        signature:
            "(expression, number?, number?, number?, number?, number?, number?) -> any",
        evaluate: ([expr, x0 = -5, x1 = 5, y0 = -5, y1 = 5, z0 = -5, z1 = 5]) => {
            const c = ce.box(expr).compile();
            const f = (x, y, z) => c({ x: x, y: y, z: z });
            VectorField3D(
                f,
                x0.value,
                x1.value,
                y0.value,
                y1.value,
                z0.value,
                z1.value
            );
        },
    });

    ce.declare("point", {
        signature: "(expression) -> any",
        evaluate: ([expr]) => {
            const c = ce.box(expr).compile();
            const f = () => c();
            Point3D(f);
        },
    });

    ce.declare("plot", {
        signature: "(expression, ...any) -> any",
        evaluate: (args) => {
            const [expr, ...params] = args;
            const boxedExpr = ce.box(expr);
            const c = boxedExpr.compile();

            const unknowns = expr.unknowns;
            let dimensions = 1;

            if (expr.head === "List" || expr.head === "Tuple") {
                dimensions = expr.toJSON().length - 1;
            }

            switch (dimensions) {
                case 1:
                    // surface
                    const [x0, x1, y0, y1, resolution] = [...Array(5).keys()].map(
                        i => params[i] || [-10, 10, -10, 10, 100][i]
                    );

                    const f = (x, y) => c({ x: x, y: y });
                    Surface3D(f, x0.value, x1.value, y0.value, y1.value, resolution.value);
                    break;
                case 3:
                    if (unknowns.includes("x") || unknowns.includes("y") || unknowns.includes("z")) {
                        // vector field
                        const [x0, x1, y0, y1, z0, z1] = [...Array(6).keys()].map(
                            i => params[i] || [-5, 5, -5, 5, -5, 5][i]
                        );

                        const f = (x, y, z) => c({ x: x, y: y, z: z });
                        VectorField3D(f, x0.value, x1.value, y0.value, y1.value, z0.value, z1.value);
                    }
                    else if (unknowns.includes("t")) {
                        // parametric line
                        const [t0, t1] = [...Array(3).keys()].map(
                            i => params[i] || [ce.parse("0"), ce.parse("10")][i]
                        );

                        const f = (t) => c({ t: t });
                        ParametricLine3D(f, t0.value, t1.value);
                    }
                    else if (unknowns.includes("u") || unknowns.includes("v")) {
                        // parametric surface
                        const [u0, u1, v0, v1, resolution] = [...Array(5).keys()].map(
                            i => params[i] || [ce.parse("-10"), ce.parse("10"), ce.parse("-10"), ce.parse("10"), ce.parse("100")][i]
                        );

                        const f = (u, v) => c({ u: u, v: v });
                        ParametricSurface3D(f, u0.value, u1.value, v0.value, v1.value, resolution.value);
                    }
                    
                    else {
                        // point

                        const f = () => c();
                        Point3D(f);
                    }
                    break;
            
                default:
                    break;
            }

            /*
            if (isVector) {
                if (parameters.includes("x") && parameters.includes("y") && parameters.includes("z")) {
                    
                }
                else if (parameters.size === 0 && isVector) {
                    
                }
                else if (parameters.size === 1 && isVector) {
                    
                }
                else if (parameters.size === 2 && isVector) {
                    const vars = Array.from(parameters);

                    // Check if it's a parametric surface (returns vector) or regular surface (returns scalar)
                    if (isVector) {
                        // Parametric surface: ["List", x(u,v), y(u,v), z(u,v)]
                        
                    }
                }
            }
                */
        },
    });

    ce.declare("output", {
        signature: "(expression) -> any",
        evaluate: ([expr]) => {
            const c = ce.box(expr).compile();
            const f = () => c({});
            console.log(f());
        },
    });
}

export function getMacros() {
    return {
        surface: "\\operatorname{surface3d}",
        sl3: "\\operatorname{parametricLine3d}",
        ps3: "\\operatorname{parametricSurface3d}",
        o: "\\operatorname{output}",
        vf3: "\\operatorname{vectorField3d}",
        p3: "\\operatorname{point3d}",
    };
}

export function clearScope() {
    ce.popScope();
    ce.pushScope();
    declarePlots();
}

export function execute(input) {
    if (input.startsWith("//")) {
        return;
    }

    const assignmentMatch = input
        .replace("\\right", "")
        .replace("\\left", "")
        .match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(\([^)]*\))?\s*=\s*(.+)$/);

    if (assignmentMatch) {
        const [, name, params, rhsLatex] = assignmentMatch;

        if (params) {
            const paramNames = params
                .slice(1, -1)
                .split(",")
                .map((p) => p.trim())
                .filter((p) => p.length > 0);

            const paramTypes = paramNames.map(() => "number").join(", ");
            const signature = `(${paramTypes}) -> number`;

            const rhsBoxed = ce.parse(rhsLatex);

            ce.declare(name, {
                signature,
                evaluate: (args) => {
                    const scope = {};
                    paramNames.forEach((varName, i) => {
                        scope[varName] = args[i];
                    });
                    return rhsBoxed.subs(scope).evaluate();
                },
            });

            return ce.symbol("Nothing");
        }

        const value = ce.parse(rhsLatex).evaluate();

        ce.declare(name, {
            type: "number",
            value: value.numericValue,
        });

        return value;
    }

    return ce.parse(input).evaluate();
}

export class ExpressionContext {
    constructor() {
        this.expressions = [];
    }

    add(expression) {
        this.expressions.push(expression);
    }

    remove(id) {
        let removedOrder = 0;
        this.expressions.forEach((e) => {
            if (e.id == id) {
                return e.element.remove();
            }
        });

        this.expressions = this.expressions.filter((e) => e.id !== id);

        this.expressions.forEach((e) => {
            if (e.id == id) {
                index = e.id;
                return e.element.remove();
            }
        });

        let index = 0;
        this.expressions.sort((a, b) => {
            b.order - a.order;
        });
        this.expressions.forEach((e) => {
            index++;
            e.order = index;
        });

        this.evaluate();
    }

    getNextOrder() {
        return Math.max(...this.expressions.map((e) => e.order), 0);
    }

    evaluate() {
        plots.clear();
        clearScope();
        this.expressions.map((e) => {
            execute(e.content);
        });
    }
}

export class Expression {
    id = 0;
    order = 0;
    content = "";
    element;
    focus;
    constructor(id, order, content, element) {
        this.id = id;
        this.order = order;
        this.content = content;
        this.element = element;
    }
}

export const expressionContext = new ExpressionContext();

let currentExpressionId = 0;

export function newExpression() {
    currentExpressionId++;
    return new Expression(
        currentExpressionId,
        expressionContext.getNextOrder() + 1,
        ""
    );
}

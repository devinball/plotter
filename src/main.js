import { newExpression, expressionContext } from "./expressions.js";
import "mathquill/build/mathquill.js";

const MQ = MathQuill.getInterface(2);

function addExpressionBox() {
    const expression = newExpression()

    const container = document.getElementById('expression-list');
    const div = document.createElement('div');
    div.className = 'expression-item';
    div.id = `expression-block-${expression.id}`
    div.innerHTML = `
        <!--<math-field class="math-edit-box" id="math-field-${expression.id}" data-id="${expression.id}"></math-field>-->
        <!--<input type="text" class="math-edit-box" id="math-field-${expression.id}">-->
        <div class="math-edit-box" id="math-field-${expression.id}"></div>
        <button class="delete-button" id="delete-button-${expression.id}" data-action="delete"><span>×</span></button>
        
    `;

    container.appendChild(div);

    const greek_lower = ' alpha nu beta xi gamma omicron delta pi epsilon rho zeta sigma eta tau theta upsilon iota phi kappa chi lambda psi mu omega'
    const greek_upper = ' Alpha Nu Beta Xi Gamma Omicron Delta Pi Epsilon Rho Zeta Sigma Eta Tau Theta Upsilon Iota Phi Kappa Chi Lambda Psi Mu Omega'
    const basic_greek = ' alpha beta gamma delta theta rho phi pi tau omega'
    const logic = ' forall mapsto reals in'
    const operators = ' prod sqrt sum int pm nabla div vec cdot partial infinity'

    var mathField = MQ.MathField(document.getElementById(`math-field-${expression.id}`), {
        spaceBehavesLikeTab: true,
        leftRightIntoCmdGoes: 'up',
        restrictMismatchedBrackets: true,
        sumStartsWithNEquals: true,
        supSubsRequireOperand: true,
        charsThatBreakOutOfSupSub: '+-=<>',
        autoSubscriptNumerals: true,
        autoCommands: (operators + basic_greek).trim(),
        maxDepth: 10,
        substituteTextarea: () => {
            return document.createElement('textarea');
        },
        handlers: {
            edit: () => {
                expression.content = mathField.latex().replace("\\text", "\\operatorname");
                expressionContext.evaluate();
            },
            enter: () => {
                addExpressionBox();
                moveFocusTo(expression.order + 1);
            },
            upOutOf: function() {
                moveFocusTo(expression.order - 1);
            },
            downOutOf: function() {
                moveFocusTo(expression.order + 1);
            },
            deleteOutOf: function() {
                if (expressionContext.expressions.length > 1) {
                        if (expression.order == 1) {
                        moveFocusTo(expression.order + 1);
                        removeExpressionBox(expression.id);
                    }
                    else {
                        moveFocusTo(expression.order - 1);
                        removeExpressionBox(expression.id);
                    }
                }
            }
        }
    });

    expression.focus = () => {mathField.focus()};

    if (expression.order == 1) {
        mathField.focus();
    }

    document.getElementById(`delete-button-${expression.id}`).addEventListener("click", (ev) => {
        removeExpressionBox(expression.id);
    })

    expression.element = div;

    expressionContext.add(expression);
}

function removeExpressionBox(id) {
    expressionContext.remove(id);
}

function moveFocusTo(order) {
    expressionContext.expressions.forEach(e => {
        if (e.order == order) {
            e.focus();
        }
    });
}


document.getElementById('add-expression-button').addEventListener('click', () => {
    addExpressionBox();
});


addExpressionBox();

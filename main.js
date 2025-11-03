import * as THREE from 'three';
import { ParametricLine3D, Surface3D, ParametricSurface3D, VectorField3D, Point3D } from './plots.js';
import { scene } from './scene.js';
import { ComputeEngine } from "@cortex-js/compute-engine";

let expressions = [];
let currentExpressionId = 0;
const ce = new ComputeEngine();


function isValidExpression(expressionString) {
    if (expressionString == "") { return false; }
    try {
        const expr = ce.parse(expressionString);
        if (expr.isValid === false || expr.head === 'Error') return false;
        expr.symbols;
        return true;
    } catch (error) {
        return false;
    }
}

function UpdateExpressions(changedVariables = null) {
    const scope = {};

    // Update only affected expressions
    expressions.forEach(expression => {
        const compiled = ce.parse(expression.content).compile()
        console.log(compiled({x: 1}));

        // stops working when doing compiled({x : 1})

        switch (expression.type) {
            case 'vector_field_3d':
                expression.cachedGeometry = VectorField3D(compiled, expression.group, scope, expression.parameters, expression.cachedGeometry);
                break;
            case 'parametric_line_3d':
                expression.cachedGeometry = ParametricLine3D(compiled, expression.group, scope, expression.parameters, expression.cachedGeometry);
                break;
            case 'surface_3d':
                expression.cachedGeometry = Surface3D(compiled, expression.group, scope, expression.parameters, expression.cachedGeometry);
                break;
            case 'parametric_surface_3d':
                expression.cachedGeometry = ParametricSurface3D(compiled, expression.group, scope, expression.parameters, expression.cachedGeometry);
                break;
            case 'point_3d':
                expression.cachedGeometry = Point3D(compiled, expression.group, scope, expression.parameters, expression.cachedGeometry);
                break;
        }

        /*
        if (!expression.enabled || expression.type === "variable") return;
        
        const valid = isValidExpression(expression.content);
        if (!valid) {
            expression.group.clear();
            return;
        }

        // Check if this expression depends on changed variables
        if (changedVariables) {
            if (!expression.dependencies) {
                const parsed = ce.parse(expression.content);
                expression.dependencies = new Set(parsed.unknowns);
            }
            
            const needsUpdate = changedVariables.some(v => expression.dependencies.has(v));
            if (!needsUpdate) return;
        }

        // Update the expression if needed
        const compiled = expression.compiled || (expression.compiled = ce.parse(expression.content).compile());
        
        
        */
    });
}

function AddExpression(type, content) {
    let expression = {
        id: currentExpressionId,
        type: type,
        content: content,
        enabled: true,
        group: new THREE.Group(),
        compiled: null,
        dependencies: null,
        cachedGeometry: null,
        parameters: {
            value: 0,
            min: -10,
            max: 10,
            animating: false,
            speed: 1,
            tMin: 0, tMax: 10,
            uMin: 0, uMax: 1,
            vMin: 0, vMax: 1,
            xMin: -5, xMax: 5,
            yMin: -5, yMax: 5,
            zMin: -5, zMax: 5
        }
    }
    currentExpressionId++;

    const container = document.getElementById('expression-list');
    const div = document.createElement('div');
    div.className = 'expression-item';
    div.id = `expression-block-${expression.id}`
    
    div.innerHTML = `
        <div class="expression-header">
            <select data-id="${expression.id}">
                <option value="" ${type === '' ? 'selected' : ''}>--Select--</option>    
                <option value="variable" ${type === 'variable' ? 'selected' : ''}>Variable</option>    
                <option value="vector_field_3d" ${type === 'vector_field_3d' ? 'selected' : ''}>Vector Field 3D</option>
                <option value="parametric_line_3d" ${type === 'parametric_line_3d' ? 'selected' : ''}>Parametric Curve 3D</option>
                <option value="surface_3d" ${type === 'surface_3d' ? 'selected' : ''}>Surface 3D</option>
                <option value="parametric_surface_3d" ${type === 'parametric_surface_3d' ? 'selected' : ''}>Parametric Surface 3D</option>
                <option value="point_3d" ${type === 'point_3d' ? 'selected' : ''}>Point 3D</option>
            </select>
            <div class="expression-controls">
                <button class="secondary small" data-id="${expression.id}" data-action="toggle">${expression.enabled ? '👁' : '👁‍🗨'}</button>
                <button class="danger small" data-id="${expression.id}" data-action="delete">×</button>
            </div>
        </div>
        <math-field class="math-edit-box" id="math-field-${expression.id}" data-id="${expression.id}"></math-field>
        <div class="parameters" id="params-${expression.id}"></div>
    `;

    container.appendChild(div);

    document.getElementById(`math-field-${expression.id}`).addEventListener('input',(ev) => {
        const expr = expressions[parseInt(ev.target.dataset.id)];
        expr.content = ev.target.value
        expr.compiled = null;
        expr.dependencies = null;
        expr.cachedGeometry = null;
        expr.group.clear();
        UpdateExpressions();
    });

    updateParams(expression);

    div.addEventListener('click', (e) => {
        const expId = parseInt(e.target.dataset.id);
        if (!expId && expId !== 0) return;
        const expr = expressions[expId];
        
        if (e.target.dataset.action === 'delete') {
            document.getElementById(`expression-block-${expr.id}`).remove();
            scene.remove(expr.group);
            expressions = expressions.filter(e => e.id !== expr.id);
        }
        else if (e.target.dataset.action === 'toggle') {
            expr.enabled = !expr.enabled;
            e.target.textContent = expr.enabled ? '👁' : '👁‍🗨';
            UpdateExpressions();
        }
        else if (e.target.dataset.action === 'animate') {
            expr.parameters.animating = !expr.parameters.animating;
            e.target.textContent = expr.parameters.animating ? '⏸' : '▶';
            if (expr.parameters.animating) animate(expr, mathField);
        }
    });

    div.addEventListener('change', (e) => {
        if (e.target.tagName === 'SELECT') {
            const expr = expressions[parseInt(e.target.dataset.id)];
            expr.type = e.target.value;
            expr.compiled = null;
            expr.dependencies = null;
            expr.cachedGeometry = null;
            expr.group.clear();
            updateParams(expr);
            UpdateExpressions();
        }
    });

    div.addEventListener('input', (e) => {
        if (!e.target.classList.contains('param')) return;
        const expr = expressions[parseInt(e.target.dataset.id)];
        const field = e.target.dataset.field;
        expr.parameters[field] = parseFloat(e.target.value);
        
        if (field === 'value') {
            const match = expr.content.match(/^([a-z])=/i);
            if (match) {
                const varName = match[1];
                const newLatex = `${varName}=${expr.parameters.value.toFixed(2)}`;
                mathField.latex(newLatex);
                expr.content = newLatex;
                
                UpdateExpressions([varName]);
                return;
            }
        }
        
        if (field === 'min' || field === 'max') {
            const slider = document.querySelector(`#params-${expr.id} .param[data-field="value"]`);
            if (slider) {
                slider.min = expr.parameters.min;
                slider.max = expr.parameters.max;
            }
        }
        
        // Invalidate cache if bounds changed
        if (field.includes('Min') || field.includes('Max')) {
            expr.cachedGeometry = null;
        }
        
        expr.group.clear();
        UpdateExpressions();
    });
    
    scene.add(expression.group);
    expressions.push(expression);
    UpdateExpressions();
}

function updateParams(expr) {
    const container = document.getElementById(`params-${expr.id}`);
    let html = '';
    
    if (expr.type === 'variable') {
        const match = expr.content.match(/^([a-z])=(.+)$/i);
        if (match) {
            expr.parameters.value = parseFloat(match[2]) || 0;
        }
        
        html = `
            <div class="param-row">
                <input type="number" class="param" data-id="${expr.id}" data-field="min" value="${expr.parameters.min}" step="0.1">
                <input type="range" class="param slider" data-id="${expr.id}" data-field="value" value="${expr.parameters.value}" min="${expr.parameters.min}" max="${expr.parameters.max}" step="0.01">
                <input type="number" class="param" data-id="${expr.id}" data-field="max" value="${expr.parameters.max}" step="0.1">
            </div>
            <div class="param-row">
                <span>Speed:</span>
                <input type="number" class="param" data-id="${expr.id}" data-field="speed" value="${expr.parameters.speed}" step="0.1" min="0.1">
                <button class="secondary small" data-id="${expr.id}" data-action="animate">▶</button>
            </div>
        `;
    }
    else if (expr.type === 'parametric_line_3d') {
        html = `<div class="param-row">
            <input type="number" class="param" data-id="${expr.id}" data-field="tMin" value="${expr.parameters.tMin}" step="0.1">
            ≤ t ≤
            <input type="number" class="param" data-id="${expr.id}" data-field="tMax" value="${expr.parameters.tMax}" step="0.1">
        </div>`;
    }
    else if (expr.type === 'parametric_surface_3d') {
        html = `
            <div class="param-row">
                <input type="number" class="param" data-id="${expr.id}" data-field="uMin" value="${expr.parameters.uMin}" step="0.1">
                ≤ u ≤
                <input type="number" class="param" data-id="${expr.id}" data-field="uMax" value="${expr.parameters.uMax}" step="0.1">
            </div>
            <div class="param-row">
                <input type="number" class="param" data-id="${expr.id}" data-field="vMin" value="${expr.parameters.vMin}" step="0.1">
                ≤ v ≤
                <input type="number" class="param" data-id="${expr.id}" data-field="vMax" value="${expr.parameters.vMax}" step="0.1">
            </div>
        `;
    }
    else if (expr.type === 'surface_3d') {
        html = `
            <div class="param-row">
                <input type="number" class="param" data-id="${expr.id}" data-field="xMin" value="${expr.parameters.xMin}" step="0.1">
                ≤ x ≤
                <input type="number" class="param" data-id="${expr.id}" data-field="xMax" value="${expr.parameters.xMax}" step="0.1">
            </div>
            <div class="param-row">
                <input type="number" class="param" data-id="${expr.id}" data-field="yMin" value="${expr.parameters.yMin}" step="0.1">
                ≤ y ≤
                <input type="number" class="param" data-id="${expr.id}" data-field="yMax" value="${expr.parameters.yMax}" step="0.1">
            </div>
        `;
    }
    else if (expr.type === 'vector_field_3d') {
        html = `
            <div class="param-row">
                <input type="number" class="param" data-id="${expr.id}" data-field="xMin" value="${expr.parameters.xMin}" step="0.1">
                ≤ x ≤
                <input type="number" class="param" data-id="${expr.id}" data-field="xMax" value="${expr.parameters.xMax}" step="0.1">
            </div>
            <div class="param-row">
                <input type="number" class="param" data-id="${expr.id}" data-field="yMin" value="${expr.parameters.yMin}" step="0.1">
                ≤ y ≤
                <input type="number" class="param" data-id="${expr.id}" data-field="yMax" value="${expr.parameters.yMax}" step="0.1">
            </div>
            <div class="param-row">
                <input type="number" class="param" data-id="${expr.id}" data-field="zMin" value="${expr.parameters.zMin}" step="0.1">
                ≤ z ≤
                <input type="number" class="param" data-id="${expr.id}" data-field="zMax" value="${expr.parameters.zMax}" step="0.1">
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function animate(expr, mathField) {
    if (!expr.parameters.animating) return;
    
    const p = expr.parameters;
    const step = ((p.max - p.min) / 100) * p.speed;
    p.value += step;
    
    if (p.value > p.max) p.value = p.min;
    
    const slider = document.querySelector(`#params-${expr.id} .param[data-field="value"]`);
    if (slider) slider.value = p.value;
    
    const match = expr.content.match(/^([a-z])=/i);
    if (match) {
        const varName = match[1];
        const newLatex = `${varName}=${p.value.toFixed(2)}`;
        mathField.latex(newLatex);
        expr.content = newLatex;
        
        UpdateExpressions([varName]);
    }
    
    requestAnimationFrame(() => animate(expr, mathField));
}

const addExpressionButton = document.getElementById('add-expression-button');
addExpressionButton.addEventListener('click', () => {
    AddExpression("", "");
});


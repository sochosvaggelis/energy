/**
 * Formula shape:
 * {
 *   base_type: "variable" | "number" | "auto",
 *   base_value: "wholesale_price" | 0.05,
 *   steps: [
 *     { op: "+"|"-"|"*"|"/", val_type: "number"|"variable", val: 1.2 | "adjustment_factor" }
 *   ]
 * }
 */

function resolveValue(type, val, variables) {
  if (type === 'variable') return Number(variables[val] ?? 0)
  return Number(val ?? 0)
}

export function evaluateFormula(formula, variables = {}) {
  if (!formula) return null

  let result = resolveValue(formula.base_type, formula.base_value, variables)

  for (const step of formula.steps || []) {
    const val = resolveValue(step.val_type || 'number', step.val, variables)
    switch (step.op) {
      case '+': result += val; break
      case '-': result -= val; break
      case '*': result *= val; break
      case '/': result = val !== 0 ? result / val : result; break
    }
  }

  return Math.round(result * 100000) / 100000
}

export function computeAutoPrice(plan, variables, { night = false } = {}) {
  const tea = Number(plan.tea ?? variables.TEA ?? variables.tea ?? 0)
  const tv = Number((night ? (plan.night_tv ?? plan.tv) : plan.tv) ?? 0)
  const ll = Number((night ? (plan.night_ll ?? plan.ll) : plan.ll) ?? 0)
  const lu = Number((night ? (plan.night_lu ?? plan.lu) : plan.lu) ?? 0)
  const alpha = Number((night ? (plan.night_alpha ?? plan.alpha) : plan.alpha) ?? 0)

  let md = 0
  if (tea < ll) {
    md = alpha * (tea - ll)
  } else if (tea > lu) {
    md = alpha * (tea - lu)
  }

  return Math.round((tv + md) * 100000) / 100000
}

export function resolvePlanPrice(plan, variables) {
  if (plan.price_formula) {
    if (plan.price_formula.base_type === 'auto') {
      return computeAutoPrice(plan, variables)
    }
    return evaluateFormula(plan.price_formula, variables)
  }
  return plan.price_per_kwh
}

export function resolvePlanNightPrice(plan, variables) {
  if (plan.night_price_formula) {
    if (plan.night_price_formula.base_type === 'auto') {
      return computeAutoPrice(plan, variables, { night: true })
    }
    return evaluateFormula(plan.night_price_formula, variables)
  }
  return plan.night_price_per_kwh
}

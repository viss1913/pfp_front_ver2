
// Эмуляция функции нормализации из src/lib/api.ts
function preparePortfolioData(portfolio) {
    const sourceRiskProfiles = portfolio.riskProfiles || portfolio.risk_profiles || []

    const data = {
        name: portfolio.name,
        classes: portfolio.classes ? portfolio.classes.map((id) => {
            if (id && typeof id === 'object') return Number(id.id)
            return Number(id)
        }).filter((n) => !isNaN(n)) : [],
    }
    return data
}

// ТЕСТОВЫЕ СЦЕНАРИИ

console.log("--- Тест 1: Удаление одной цели ---");
// Допустим, у нас было [1, 2], пользователь удалил 1.
// В состоянии формы осталось [2].
const formData1 = {
    name: "Портфель тест",
    classes: [2], // Остались только Инвестиции (ID 2)
    riskProfiles: []
};
const result1 = preparePortfolioData(formData1);
console.log("Результат classes:", JSON.stringify(result1.classes));
console.log("Ожидалось: [2]");
console.log("Успех:", JSON.stringify(result1.classes) === "[2]");

console.log("\n--- Тест 2: Удаление ВСЕХ целей ---");
// Пользователь удалил всё.
const formData2 = {
    name: "Портфель пустой",
    classes: [], // Пустой массив
    riskProfiles: []
};
const result2 = preparePortfolioData(formData2);
console.log("Результат classes:", JSON.stringify(result2.classes));
console.log("Ожидалось: []");
console.log("Успех:", JSON.stringify(result2.classes) === "[]");

console.log("\n--- Тест 3: Смешанные типы (строки и числа) ---");
// Иногда из селекта приходят строки "2", а не числа 2.
const formData3 = {
    name: "Портфель микс",
    classes: ["2", 3, "4"],
    riskProfiles: []
};
const result3 = preparePortfolioData(formData3);
console.log("Результат classes:", JSON.stringify(result3.classes));
console.log("Ожидалось: [2, 3, 4]");
console.log("Успех:", JSON.stringify(result3.classes) === "[2,3,4]");

// Dark mode setup
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (event.matches) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
});

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Format percentage
function formatPercent(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value / 100);
}

// Show error
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
    document.getElementById('warningMessage').classList.add('hidden');
    document.getElementById('results').classList.add('hidden');
}

// Show warning
function showWarning(message) {
    const warningDiv = document.getElementById('warningMessage');
    const warningText = document.getElementById('warningText');
    warningText.textContent = message;
    warningDiv.classList.remove('hidden');
    document.getElementById('errorMessage').classList.add('hidden');
}

// Hide messages
function hideMessages() {
    document.getElementById('errorMessage').classList.add('hidden');
    document.getElementById('warningMessage').classList.add('hidden');
}

// Calculate distribution
function calculateSureBet(valorTotal, oddA, oddB, lucroMinimo = 0) {
    // Validações
    if (valorTotal <= 0) {
        throw new Error('O valor total deve ser maior que zero.');
    }
    if (oddA <= 1.0) {
        throw new Error('A Odd do Time A deve ser maior que 1.0.');
    }
    if (oddB <= 1.0) {
        throw new Error('A Odd do Time B deve ser maior que 1.0.');
    }
    if (lucroMinimo < 0) {
        throw new Error('O lucro mínimo não pode ser negativo.');
    }

    // Verificar se é possível garantir o lucro mínimo com as odds fornecidas
    // Para que seja possível: (valorTotal + lucroMinimo) / oddA + (valorTotal + lucroMinimo) / oddB <= valorTotal
    const somaMinima = (valorTotal + lucroMinimo) / oddA + (valorTotal + lucroMinimo) / oddB;

    if (somaMinima > valorTotal) {
        const lucroMaximo = valorTotal - (valorTotal / oddA + valorTotal / oddB);
        throw new Error(
            `Não é possível garantir lucro de R$ ${lucroMinimo.toFixed(2)} com essas odds. ` +
            `O lucro máximo garantido possível é de aproximadamente R$ ${lucroMaximo.toFixed(2)}.`
        );
    }

    // Cálculo com lucro mínimo desejado
    // Queremos: valorA * oddA = valorTotal + lucroMinimo + ajusteA
    //           valorB * oddB = valorTotal + lucroMinimo + ajusteB
    // Onde ajusteA e ajusteB são os excedentes (devem ser >= 0)
    // E: valorA + valorB = valorTotal

    // Se quisermos distribuir igualmente o excedente:
    // valorA * oddA = valorB * oddB = valorTotal + lucro
    // Então: valorA = (valorTotal + lucro) / oddA
    //        valorB = (valorTotal + lucro) / oddB
    // Mas valorA + valorB deve ser = valorTotal

    // Vamos usar uma abordagem onde distribuímos para garantir lucro mínimo
    // e distribuímos o excedente proporcionalmente

    // Cálculo base para lucro igual em ambos cenários
    const valorA = (valorTotal * oddB) / (oddA + oddB);
    const valorB = (valorTotal * oddA) / (oddA + oddB);

    // Lucro base sem ajuste
    const lucroBase = valorA * oddA - valorTotal;

    if (lucroBase < lucroMinimo) {
        // Precisamos ajustar - isso já foi verificado acima, mas por segurança
        throw new Error('Impossível alcançar o lucro mínimo desejado com essas odds.');
    }

    // Lucros em cada cenário (são iguais nesta distribuição)
    const lucroA = valorA * oddA - valorTotal;
    const lucroB = valorB * oddB - valorTotal;

    // Retornos totais
    const retornoA = valorA * oddA;
    const retornoB = valorB * oddB;

    return {
        valorA,
        valorB,
        lucroA,
        lucroB,
        retornoA,
        retornoB,
        percentA: (valorA / valorTotal) * 100,
        percentB: (valorB / valorTotal) * 100,
        lucroMedio: (lucroA + lucroB) / 2
    };
}

// Handle form submit
document.getElementById('betForm').addEventListener('submit', function (e) {
    e.preventDefault();
    hideMessages();

    try {
        // Get values
        const valorTotal = parseFloat(document.getElementById('valorTotal').value);
        const oddA = parseFloat(document.getElementById('oddA').value);
        const oddB = parseFloat(document.getElementById('oddB').value);
        const lucroMinimo = parseFloat(document.getElementById('lucroMinimo').value) || 0;

        // Calculate
        const result = calculateSureBet(valorTotal, oddA, oddB, lucroMinimo);

        // Show warning if profit is negative
        if (result.lucroA < 0 || result.lucroB < 0) {
            showWarning(
                'ATENÇÃO: Com essas odds, você terá PREJUÍZO independente do resultado. ' +
                'Isso NÃO é uma Sure Bet. Considere não fazer essa aposta ou encontrar odds melhores.'
            );
        } else if (result.lucroA < 1 && result.lucroB < 1) {
            showWarning(
                'O lucro é muito baixo (menos de R$ 1,00). Considere se vale a pena fazer essa aposta.'
            );
        }

        // Display results
        document.getElementById('resultValorA').textContent = formatCurrency(result.valorA);
        document.getElementById('resultValorB').textContent = formatCurrency(result.valorB);
        document.getElementById('resultPercentA').textContent = formatPercent(result.percentA);
        document.getElementById('resultPercentB').textContent = formatPercent(result.percentB);
        document.getElementById('resultLucroA').textContent = formatCurrency(result.lucroA);
        document.getElementById('resultLucroB').textContent = formatCurrency(result.lucroB);
        document.getElementById('resultRetornoA').textContent = 'Retorno total: ' + formatCurrency(result.retornoA);
        document.getElementById('resultRetornoB').textContent = 'Retorno total: ' + formatCurrency(result.retornoB);
        document.getElementById('resultInvestimento').textContent = formatCurrency(valorTotal);
        document.getElementById('resultLucroMedio').textContent = formatCurrency(result.lucroMedio);

        // Show results
        document.getElementById('results').classList.remove('hidden');

        // Scroll to results
        setTimeout(() => {
            document.getElementById('results').scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }, 100);

    } catch (error) {
        showError(error.message);
    }
});

// Real-time validation feedback
document.getElementById('oddA').addEventListener('input', function () {
    const value = parseFloat(this.value);
    if (value && value <= 1.0) {
        this.classList.add('border-red-500');
    } else {
        this.classList.remove('border-red-500');
    }
});

document.getElementById('oddB').addEventListener('input', function () {
    const value = parseFloat(this.value);
    if (value && value <= 1.0) {
        this.classList.add('border-red-500');
    } else {
        this.classList.remove('border-red-500');
    }
});

document.getElementById('valorTotal').addEventListener('input', function () {
    const value = parseFloat(this.value);
    if (value && value <= 0) {
        this.classList.add('border-red-500');
    } else {
        this.classList.remove('border-red-500');
    }

    // Calcular e mostrar multiplicador necessário para R$ 20 de lucro
    updateMultiplicadorHelper(value);
});

// Função para calcular e exibir o multiplicador necessário
function updateMultiplicadorHelper(valorTotal) {
    const helperDiv = document.getElementById('multiplicadorHelper');
    const helperText = document.getElementById('multiplicadorHelperText');
    const examplesList = document.getElementById('oddsExamples');

    if (!valorTotal || valorTotal <= 0) {
        helperDiv.classList.add('hidden');
        return;
    }

    const lucroDesejado = 20; // R$ 20 de lucro

    // Para uma sure bet, o lucro é: L = V * ((oddA * oddB - oddA - oddB) / (oddA + oddB))
    // Assumindo oddA ≈ oddB ≈ M (multiplicador médio):
    // L ≈ V * (M - 2) / 2
    // M ≈ 2 + 2L/V
    const multiplicadorMedioNecessario = 2 + (2 * lucroDesejado / valorTotal);

    // Verificar se é possível
    if (multiplicadorMedioNecessario < 1.01) {
        helperDiv.classList.add('hidden');
        return;
    }

    // Gerar exemplos de odds que funcionam
    const exemplos = [];

    // Exemplo 1: Odds iguais
    const oddIgual = multiplicadorMedioNecessario;
    if (oddIgual >= 1.01 && oddIgual <= 50) {
        exemplos.push({
            oddA: oddIgual,
            oddB: oddIgual,
            descricao: 'Odds iguais'
        });
    }

    // Exemplo 2: Uma odd menor, outra maior (70/30)
    // oddA * oddB / (oddA + oddB) = multiplicadorMedio
    // Vamos tentar oddA = multiplicadorMedio * 0.7 e ajustar oddB
    const oddA_70 = multiplicadorMedioNecessario * 0.85;
    // Resolver para oddB usando a fórmula do lucro
    // Queremos: valorTotal * ((oddA * oddB - oddA - oddB) / (oddA + oddB)) = lucroDesejado
    // Simplificando: oddA * oddB - oddA - oddB = lucroDesejado * (oddA + oddB) / valorTotal
    const ratio = lucroDesejado / valorTotal;
    // oddA * oddB - oddA - oddB = ratio * (oddA + oddB)
    // oddA * oddB = oddA + oddB + ratio * (oddA + oddB)
    // oddA * oddB = (oddA + oddB) * (1 + ratio)
    // oddB = (oddA + oddB) * (1 + ratio) / oddA
    // oddB * oddA = (oddA + oddB) * (1 + ratio)
    // oddB * oddA - oddB * (1 + ratio) = oddA * (1 + ratio)
    // oddB * (oddA - 1 - ratio) = oddA * (1 + ratio)
    // oddB = oddA * (1 + ratio) / (oddA - 1 - ratio)
    const oddB_70 = oddA_70 * (1 + ratio) / (oddA_70 - 1 - ratio);

    if (oddA_70 >= 1.01 && oddB_70 >= 1.01 && oddB_70 <= 50 && oddA_70 <= 50) {
        exemplos.push({
            oddA: oddA_70,
            oddB: oddB_70,
            descricao: 'Odds diferentes'
        });
    }

    // Exemplo 3: Uma odd bem baixa, outra alta
    const oddA_baixa = Math.max(1.05, multiplicadorMedioNecessario * 0.6);
    const oddB_alta = oddA_baixa * (1 + ratio) / (oddA_baixa - 1 - ratio);

    if (oddA_baixa >= 1.01 && oddB_alta >= 1.01 && oddB_alta <= 50 && Math.abs(oddA_baixa - oddA_70) > 0.1) {
        exemplos.push({
            oddA: oddA_baixa,
            oddB: oddB_alta,
            descricao: 'Favorito vs Azarão'
        });
    }

    // Atualizar texto
    helperText.innerHTML = `Para garantir <strong>lucro de R$ 20,00</strong> com R$ ${formatCurrency(valorTotal).replace('R$\xa0', '')}, ` +
        `você precisa de odds cujo multiplicador médio seja de pelo menos <strong>${multiplicadorMedioNecessario.toFixed(2)}</strong>.`;

    // Atualizar exemplos
    examplesList.innerHTML = '';
    exemplos.forEach(exemplo => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${exemplo.descricao}:</strong> Odd A = ${exemplo.oddA.toFixed(2)} | Odd B = ${exemplo.oddB.toFixed(2)}`;
        examplesList.appendChild(li);
    });

    // Mostrar helper
    helperDiv.classList.remove('hidden');
}

document.getElementById('lucroMinimo').addEventListener('input', function () {
    const value = parseFloat(this.value);
    if (value && value < 0) {
        this.classList.add('border-red-500');
    } else {
        this.classList.remove('border-red-500');
    }
});
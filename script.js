// ===== GLOBAL VARIABLES =====
let allResults = [];
let currentSort = 'strength';
let currentFilter = 'all';
let assetSettings = {};

// ===== ASSET CONFIGURATIONS =====
const ASSET_CONFIGS = {
    stocks: {
        name: 'מניות',
        scaleFactor: 1,
        gannDivisor: 20,
        weights: {
            gann: 1.4,
            fibonacci: 1.3,
            lunar: 1.0,
            astro: 1.1,
            gematria: 0.8,
            natural: 1.2
        },
        excludeWeekends: true
    },
    forex: {
        name: 'מטבעות חוץ',
        scaleFactor: 0.0001,
        gannDivisor: 5,
        weights: {
            gann: 1.2,
            fibonacci: 1.0,
            lunar: 1.5,
            astro: 1.5,
            gematria: 0.5,
            natural: 1.0
        },
        excludeWeekends: false
    },
    crypto: {
        name: 'קריפטו',
        scaleFactor: 10,
        gannDivisor: 100,
        weights: {
            gann: 1.1,
            fibonacci: 1.2,
            lunar: 1.3,
            astro: 1.2,
            gematria: 0.7,
            natural: 2.0
        },
        excludeWeekends: false
    },
    commodities: {
        name: 'סחורות',
        scaleFactor: 0.1,
        gannDivisor: 10,
        weights: {
            gann: 1.3,
            fibonacci: 1.2,
            lunar: 1.4,
            astro: 1.3,
            gematria: 0.6,
            natural: 1.1
        },
        excludeWeekends: false
    },
    etf: {
        name: 'תעודות סל (ETF)',
        scaleFactor: 1,
        gannDivisor: 15,
        weights: {
            gann: 1.4,
            fibonacci: 1.3,
            lunar: 0.9,
            astro: 1.0,
            gematria: 0.8,
            natural: 1.2
        },
        excludeWeekends: true
    },
    indices: {
        name: 'מדדים',
        scaleFactor: 1,
        gannDivisor: 25,
        weights: {
            gann: 1.5,
            fibonacci: 1.4,
            lunar: 1.1,
            astro: 1.2,
            gematria: 0.9,
            natural: 1.3
        },
        excludeWeekends: true
    }
};

// ===== UTILITY FUNCTIONS =====
function formatDate(date) {
    return new Date(date).toLocaleDateString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function addDays(date, days, excludeWeekends = false) {
    const result = new Date(date);
    let addedDays = 0;
    
    while (addedDays < days) {
        result.setDate(result.getDate() + 1);
        
        if (excludeWeekends) {
            const dayOfWeek = result.getDay();
            // Skip Saturday (6) and Sunday (0)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                addedDays++;
            }
        } else {
            addedDays++;
        }
    }
    
    return result;
}

function calculateDaysDifference(startDate, endDate, excludeWeekends = false) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let days = 0;
    const current = new Date(start);
    
    while (current < end) {
        current.setDate(current.getDate() + 1);
        
        if (excludeWeekends) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                days++;
            }
        } else {
            days++;
        }
    }
    
    return days;
}

// ===== CALCULATION METHODS =====
function calculateGannDates(basePrice, baseDate, timeRange, config) {
    const dates = [];
    const sqrt = Math.sqrt(basePrice * config.scaleFactor);
    const gannAngles = [45, 90, 135, 180, 225, 270, 315, 360];
    
    gannAngles.forEach(angle => {
        const cycleDays = Math.round(sqrt * angle / config.gannDivisor);
        if (cycleDays > 0 && cycleDays <= timeRange) {
            const targetDate = addDays(baseDate, cycleDays, config.excludeWeekends);
            dates.push({
                date: targetDate,
                days: cycleDays,
                method: 'Gann',
                details: `זווית ${angle}°`,
                strength: 1
            });
        }
    });
    
    return dates;
}

function calculateFibonacciDates(baseDate, timeRange, config) {
    const dates = [];
    const fibSequence = [8, 13, 21, 34, 55, 89, 144, 233, 377];
    
    fibSequence.forEach(days => {
        if (days <= timeRange) {
            const targetDate = addDays(baseDate, days, config.excludeWeekends);
            dates.push({
                date: targetDate,
                days: days,
                method: 'פיבונאצ\'י',
                details: `מחזור ${days} ימים`,
                strength: 1
            });
        }
    });
    
    return dates;
}

function calculateLunarDates(baseDate, timeRange, config) {
    const dates = [];
    const lunarCycle = 29.53;
    
    for (let i = 1; i <= Math.floor(timeRange / lunarCycle); i++) {
        const days = Math.round(lunarCycle * i);
        const targetDate = addDays(baseDate, days, false); // אסטרולוגיה תמיד לפי לוח רגיל
        
        dates.push({
            date: targetDate,
            days: days,
            method: 'מחזור ירח',
            details: `מחזור ${i}`,
            strength: 1
        });
    }
    
    return dates;
}

function calculateAstroDates(baseDate, timeRange, config) {
    const dates = [];
    const aspects = [0, 90, 120, 180]; // Conjunction, Square, Trine, Opposition
    const planetaryCycle = 365.25 / 12; // חודש אסטרולוגי ממוצע
    
    aspects.forEach(aspect => {
        const cycleDays = Math.round(planetaryCycle * aspect / 30);
        if (cycleDays > 0 && cycleDays <= timeRange) {
            const targetDate = addDays(baseDate, cycleDays, false);
            dates.push({
                date: targetDate,
                days: cycleDays,
                method: 'אסטרולוגיה',
                details: `אספקט ${aspect}°`,
                strength: 1
            });
        }
    });
    
    return dates;
}

function calculateGematriaDates(basePrice, baseDate, timeRange, config) {
    const dates = [];
    const priceStr = basePrice.toString().replace('.', '');
    const gematriaSum = priceStr.split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    const gematriaCycles = [7, 22, 32, 72]; // מספרים קבליים חשובים
    
    gematriaCycles.forEach(cycle => {
        const days = (gematriaSum * cycle) % 365;
        if (days > 0 && days <= timeRange) {
            const targetDate = addDays(baseDate, days, config.excludeWeekends);
            dates.push({
                date: targetDate,
                days: days,
                method: 'גימטריה',
                details: `${gematriaSum} × ${cycle}`,
                strength: 1
            });
        }
    });
    
    return dates;
}

function calculateNaturalDates(baseDate, timeRange, config) {
    const dates = [];
    const naturalCycles = [7, 14, 28, 91, 182]; // שבוע, חצי חודש, חודש, עונה, חצי שנה
    
    naturalCycles.forEach(days => {
        if (days <= timeRange) {
            const targetDate = addDays(baseDate, days, config.excludeWeekends);
            dates.push({
                date: targetDate,
                days: days,
                method: 'טבעי',
                details: `מחזור ${days} ימים`,
                strength: 1
            });
        }
    });
    
    return dates;
}

// ===== MAIN CALCULATION FUNCTION =====
function calculateAllDates() {
    const basePrice = parseFloat(document.getElementById('base-price').value);
    const baseDate = new Date(document.getElementById('base-date').value);
    const timeRange = parseInt(document.getElementById('time-range').value);
    const assetType = document.getElementById('asset-type').value;
    const accuracyLevel = document.getElementById('accuracy-level').value;
    
    if (!basePrice || !baseDate || !timeRange) {
        alert('אנא מלא את כל השדות הנדרשים');
        return;
    }
    
    const config = ASSET_CONFIGS[assetType];
    const selectedMethods = Array.from(document.querySelectorAll('input[name="methods"]:checked'))
        .map(cb => cb.value);
    
    if (selectedMethods.length === 0) {
        alert('אנא בחר לפחות שיטת חישוב אחת');
        return;
    }
    
    showLoading();
    
    // Clear previous results
    allResults = [];
    
    setTimeout(() => {
        let allDates = [];
        
        // Calculate dates for each selected method
        if (selectedMethods.includes('gann')) {
            allDates = allDates.concat(calculateGannDates(basePrice, baseDate, timeRange, config));
        }
        
        if (selectedMethods.includes('fibonacci')) {
            allDates = allDates.concat(calculateFibonacciDates(baseDate, timeRange, config));
        }
        
        if (selectedMethods.includes('lunar')) {
            allDates = allDates.concat(calculateLunarDates(baseDate, timeRange, config));
        }
        
        if (selectedMethods.includes('astro')) {
            allDates = allDates.concat(calculateAstroDates(baseDate, timeRange, config));
        }
        
        if (selectedMethods.includes('gematria')) {
            allDates = allDates.concat(calculateGematriaDates(basePrice, baseDate, timeRange, config));
        }
        
        if (selectedMethods.includes('natural')) {
            allDates = allDates.concat(calculateNaturalDates(baseDate, timeRange, config));
        }
        
        // Filter future dates only
        const futureStartDate = new Date(baseDate);
        futureStartDate.setDate(futureStartDate.getDate() + 1);
        
        allDates = allDates.filter(d => d.date >= futureStartDate);
        
        // Group by date and calculate convergences
        const dateGroups = {};
        allDates.forEach(dateObj => {
            const dateKey = dateObj.date.toDateString();
            if (!dateGroups[dateKey]) {
                dateGroups[dateKey] = {
                    date: dateObj.date,
                    methods: [],
                    totalStrength: 0,
                    days: dateObj.days
                };
            }
            
            dateGroups[dateKey].methods.push({
                method: dateObj.method,
                details: dateObj.details,
                weight: config.weights[dateObj.method.toLowerCase()] || 1
            });
            
            const weight = config.weights[dateObj.method.toLowerCase()] || 1;
            dateGroups[dateKey].totalStrength += weight;
        });
        
        // Convert to final results
        allResults = Object.values(dateGroups).map(group => {
            const strengthLevel = Math.min(5, Math.ceil(group.totalStrength));
            let timeWindow = '';
            
            if (accuracyLevel === 'high' && strengthLevel >= 4) {
                const windowStart = new Date(group.date);
                const windowEnd = new Date(group.date);
                windowStart.setDate(windowStart.getDate() - 2);
                windowEnd.setDate(windowEnd.getDate() + 2);
                timeWindow = `חלון: ${formatDate(windowStart)} - ${formatDate(windowEnd)}`;
            }
            
            return {
                date: group.date,
                formattedDate: formatDate(group.date),
                days: group.days,
                methods: group.methods,
                methodNames: group.methods.map(m => m.method).join(', '),
                strength: strengthLevel,
                convergences: group.methods.length,
                totalStrength: group.totalStrength,
                timeWindow: timeWindow,
                daysFromStart: calculateDaysDifference(baseDate, group.date, config.excludeWeekends)
            };
        });
        
        hideLoading();
        displayResults();
        updateAnalysis();
        
    }, 500);
}

// ===== DISPLAY FUNCTIONS =====
function showLoading() {
    document.getElementById('loading-indicator').style.display = 'flex';
    document.getElementById('results-container').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading-indicator').style.display = 'none';
}

function displayResults() {
    if (allResults.length === 0) {
        document.getElementById('empty-state').style.display = 'flex';
        return;
    }
    
    document.getElementById('results-container').style.display = 'block';
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('export-btn').style.display = 'inline-flex';
    
    // Sort results
    sortResults();
    
    // Display stats
    displayStats();
    
    // Display timeline
    displayTimeline();
    
    // Display chart
    displayChart();
}

function sortResults() {
    if (currentSort === 'strength') {
        allResults.sort((a, b) => b.strength - a.strength || b.totalStrength - a.totalStrength);
    } else {
        allResults.sort((a, b) => a.date - b.date);
    }
}

function displayStats() {
    const statsContainer = document.getElementById('results-stats');
    const totalDates = allResults.length;
    const strongDates = allResults.filter(r => r.strength >= 4).length;
    const criticalDates = allResults.filter(r => r.strength >= 5).length;
    const avgStrength = totalDates > 0 ? 
        (allResults.reduce((sum, r) => sum + r.strength, 0) / totalDates).toFixed(1) : 0;
    
    const baseDate = new Date(document.getElementById('base-date').value);
    const timeRange = parseInt(document.getElementById('time-range').value);
    const endDate = addDays(baseDate, timeRange, false);
    
    statsContainer.innerHTML = `
        <div class="stat-item">
            <span class="stat-value">${totalDates}</span>
            <span class="stat-label">תאריכים עתידיים</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${strongDates}</span>
            <span class="stat-label">תאריכים חזקים</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${criticalDates}</span>
            <span class="stat-label">תאריכים קריטיים</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${avgStrength}</span>
            <span class="stat-label">עוצמה ממוצעת</span>
        </div>
        <div class="stat-item" style="grid-column: 1 / -1; text-align: center; font-size: 0.8rem; color: var(--text-secondary);">
            תקופת חישוב: ${formatDate(baseDate)} - ${formatDate(endDate)}
        </div>
    `;
}

function displayTimeline() {
    const timelineContainer = document.getElementById('results-timeline');
    let filteredResults = [...allResults];
    
    // Apply filter
    if (currentFilter === 'strong') {
        filteredResults = filteredResults.filter(r => r.strength >= 4);
    } else if (currentFilter === 'critical') {
        filteredResults = filteredResults.filter(r => r.strength >= 5);
    }
    
    if (filteredResults.length === 0) {
        timelineContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">אין תוצאות מתאימות לסינון הנבחר</p>';
        return;
    }
    
    const timelineHTML = filteredResults.map((result, index) => {
        const stars = '⭐'.repeat(result.strength);
        const dayType = document.getElementById('exclude-weekends').checked && 
                       ASSET_CONFIGS[document.getElementById('asset-type').value].excludeWeekends ? 
                       'ימי מסחר' : 'ימים';
        
        return `
            <div class="timeline-item strength-${result.strength}">
                <div class="timeline-date">
                    #${index + 1} ${result.formattedDate}
                </div>
                <div class="timeline-content">
                    <div class="timeline-strength">
                        <span class="stars">${stars}</span>
                        <span>(${result.convergences} התכנסויות)</span>
                    </div>
                    <div class="timeline-methods">${result.methodNames}</div>
                    <div class="timeline-window">
                        +${result.daysFromStart} ${dayType} מנקודת הבסיס
                        ${result.timeWindow ? '<br>' + result.timeWindow : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    timelineContainer.innerHTML = timelineHTML;
}

function displayChart() {
    const canvas = document.getElementById('chart-canvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (allResults.length === 0) return;
    
    // Prepare data
    const data = allResults.slice(0, 20); // Show first 20 results
    const maxStrength = Math.max(...data.map(d => d.strength));
    const barWidth = canvas.width / data.length - 4;
    const maxBarHeight = canvas.height - 40;
    
    // Draw bars
    data.forEach((result, index) => {
        const barHeight = (result.strength / maxStrength) * maxBarHeight;
        const x = index * (barWidth + 4) + 2;
        const y = canvas.height - barHeight - 20;
        
        // Color based on strength
        let color;
        if (result.strength >= 5) color = '#dc2626';
        else if (result.strength >= 4) color = '#7c3aed';
        else if (result.strength >= 3) color = '#0284c7';
        else if (result.strength >= 2) color = '#059669';
        else color = '#6b7280';
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw date label
        ctx.fillStyle = '#374151';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        const shortDate = result.formattedDate.split('.').slice(0, 2).join('.');
        ctx.fillText(shortDate, x + barWidth / 2, canvas.height - 5);
    });
    
    // Draw legend
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('עוצמת התאריכים (20 הראשונים)', 10, 15);
}

function updateAnalysis() {
    const analysisContent = document.getElementById('analysis-content');
    
    if (allResults.length === 0) {
        analysisContent.innerHTML = '<p class="analysis-placeholder">בצע חישוב כדי לראות ניתוח מפורט</p>';
        return;
    }
    
    const strongDates = allResults.filter(r => r.strength >= 4);
    const criticalDates = allResults.filter(r => r.strength >= 5);
    const topDate = allResults[0];
    
    let recommendations = [];
    
    if (criticalDates.length > 0) {
        recommendations.push(`🔥 זוהו ${criticalDates.length} תאריכים קריטיים - סבירות גבוהה מאוד למפנה`);
    }
    
    if (strongDates.length > 0) {
        recommendations.push(`⭐ ${strongDates.length} תאריכים חזקים נוספים דורשים מעקב`);
    }
    
    if (topDate) {
        recommendations.push(`📅 התאריך החזק ביותר: ${topDate.formattedDate} (${topDate.convergences} התכנסויות)`);
    }
    
    recommendations.push('💡 המלצה: בדוק את התאריכים בפלטפורמת המסחר שלך');
    recommendations.push('⚠️ השתמש בניתוח טכני נוסף לאישור הכיוון');
    
    analysisContent.innerHTML = `
        <div class="analysis-results">
            ${recommendations.map(rec => `<div class="analysis-item">${rec}</div>`).join('')}
        </div>
    `;
}

// ===== EXPORT FUNCTION =====
function exportResults() {
    if (allResults.length === 0) {
        alert('אין תוצאות לייצוא');
        return;
    }
    
    const baseDate = document.getElementById('base-date').value;
    const basePrice = document.getElementById('base-price').value;
    const assetType = document.getElementById('asset-type').value;
    const assetName = ASSET_CONFIGS[assetType].name;
    const accuracyLevel = document.getElementById('accuracy-level').value;
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    
    // Headers
    csvContent += "תאריך,ימים מהבסיס,עוצמה,התכנסויות,שיטות,המלצה,חלון זמן\n";
    
    // Data rows
    allResults.forEach(result => {
        let recommendation = '';
        if (result.strength >= 5) {
            recommendation = 'תאריך קריטי! סבירות גבוהה מאוד למפנה';
        } else if (result.strength >= 4) {
            recommendation = 'תאריך חשוב. סבירות בינונית-גבוהה למפנה';
        } else {
            recommendation = 'תאריך משני. מעקב בזהירות';
        }
        
        const timeWindow = result.timeWindow || 'תאריך מדויק';
        
        csvContent += `${result.formattedDate},${result.daysFromStart},${result.strength},${result.convergences},"${result.methodNames}","${recommendation}","${timeWindow}"\n`;
    });
    
    // Summary
    csvContent += `\n\nסיכום:\n`;
    csvContent += `נכס: ${assetName}\n`;
    csvContent += `מחיר בסיס: ${basePrice}\n`;
    csvContent += `תאריך בסיס: ${baseDate}\n`;
    csvContent += `רמת דיוק: ${accuracyLevel === 'high' ? 'גבוהה' : 'רגילה'}\n`;
    csvContent += `סה"כ תאריכים: ${allResults.length}\n`;
    csvContent += `תאריכים חזקים (4+ כוכבים): ${allResults.filter(r => r.strength >= 4).length}\n`;
    csvContent += `תאריכים קריטיים (5 כוכבים): ${allResults.filter(r => r.strength >= 5).length}\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gann_dates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('הקובץ יוצא בהצלחה! בדוק את תיקיית ההורדות.');
}

// ===== EVENT HANDLERS =====
function setupEventListeners() {
    // Asset type change
    document.getElementById('asset-type').addEventListener('change', function() {
        const assetType = this.value;
        const config = ASSET_CONFIGS[assetType];
        const excludeWeekendsCheckbox = document.getElementById('exclude-weekends');
        
        // Auto-set weekend exclusion based on asset type
        excludeWeekendsCheckbox.checked = config.excludeWeekends;
        
        // Update checkbox label
        const label = excludeWeekendsCheckbox.parentElement.querySelector('.form-help');
        if (config.excludeWeekends) {
            label.textContent = `מומלץ ל${config.name} - השווקים סגורים בסופי שבוע`;
        } else {
            label.textContent = `לא נדרש ל${config.name} - המסחר פעיל 24/7`;
        }
    });
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Update active tab button
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
    
    // Sort buttons
    document.getElementById('sort-strength').addEventListener('click', function() {
        currentSort = 'strength';
        updateSortButtons();
        displayTimeline();
    });
    
    document.getElementById('sort-date').addEventListener('click', function() {
        currentSort = 'date';
        updateSortButtons();
        displayTimeline();
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentFilter = this.dataset.filter;
            updateFilterButtons();
            displayTimeline();
        });
    });
    
    // Action buttons
    document.getElementById('sample-data-btn').addEventListener('click', fillSampleData);
    document.getElementById('calculate-btn').addEventListener('click', calculateAllDates);
    document.getElementById('reset-btn').addEventListener('click', resetSystem);
    document.getElementById('export-btn').addEventListener('click', exportResults);
}

function updateSortButtons() {
    document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
    if (currentSort === 'strength') {
        document.getElementById('sort-strength').classList.add('active');
    } else {
        document.getElementById('sort-date').classList.add('active');
    }
    sortResults();
}

function updateFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.filter-btn[data-filter="${currentFilter}"]`).classList.add('active');
}

function fillSampleData() {
    // Set sample date to a historical date for testing
    document.getElementById('base-price').value = '1850.50';
    document.getElementById('base-date').value = '2021-05-25';
    document.getElementById('time-range').value = '180';
    
    // Choose asset type based on price pattern
    document.getElementById('asset-type').value = 'forex';
    
    // Trigger change event to update settings
    document.getElementById('asset-type').dispatchEvent(new Event('change'));
    
    alert('נתוני דוגמה הוזנו! לחץ על "חשב תאריכי מפנה" כדי לראות תוצאות.');
}

function resetSystem() {
    // Clear all inputs
    document.getElementById('base-price').value = '';
    document.getElementById('base-date').value = '';
    document.getElementById('time-range').value = '180';
    document.getElementById('asset-type').value = 'stocks';
    document.getElementById('accuracy-level').value = 'standard';
    document.getElementById('exclude-weekends').checked = true;
    
    // Reset checkboxes
    document.querySelectorAll('input[name="methods"]').forEach(cb => cb.checked = true);
    
    // Clear results
    allResults = [];
    currentSort = 'strength';
    currentFilter = 'all';
    
    // Hide results and show empty state
    document.getElementById('results-container').style.display = 'none';
    document.getElementById('empty-state').style.display = 'flex';
    document.getElementById('export-btn').style.display = 'none';
    
    // Reset buttons
    updateSortButtons();
    updateFilterButtons();
    
    // Update analysis
    updateAnalysis();
    
    alert('המערכת אופסה בהצלחה!');
}

// ===== CANVAS DRAWING =====
function drawGannSquare() {
    const canvas = document.getElementById('gann-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const size = 200;
    const center = size / 2;
    const gridSize = 8;
    const cellSize = size / gridSize;
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= gridSize; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, size);
        ctx.stroke();
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(size, i * cellSize);
        ctx.stroke();
    }
    
    // Draw center cross (important angles)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(center, 0);
    ctx.lineTo(center, size);
    ctx.stroke();
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, center);
    ctx.lineTo(size, center);
    ctx.stroke();
    
    // Draw diagonals
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    
    // Main diagonal
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, size);
    ctx.stroke();
    
    // Anti-diagonal
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(size, 0);
    ctx.stroke();
    
    // Draw center point
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(center, center, 4, 0, 2 * Math.PI);
    ctx.fill();
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    drawGannSquare();
    
    // Set default date to today
    const today = new Date();
    document.getElementById('base-date').value = today.toISOString().split('T')[0];
    
    // Trigger initial asset type setup
    document.getElementById('asset-type').dispatchEvent(new Event('change'));
    
    console.log('Gann Square of Nine Dashboard initialized successfully!');
});
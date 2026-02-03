// Initialize sleep chart
let sleepChart;

// Check if user is logged in
const userId = localStorage.getItem('user_id');
if (!userId) {
    alert("User not signed in. Please log in.");
    window.location.href = '/';
}

// DOM Elements
const sleepForm = document.getElementById('sleepForm');
const sleepNotes = document.getElementById('sleepNotes');
const saveNotesBtn = document.getElementById('saveNotes');
const avgSleepElement = document.getElementById('avgSleep');
const sleepStreakElement = document.getElementById('sleepStreak');
const sleepGoalElement = document.getElementById('sleepGoal');

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    initializeChart();
    loadSleepData();
    loadSleepStats();
    loadSleepNotes();
});

// Initialize Chart.js
function initializeChart() {
    const ctx = document.getElementById('sleepChart').getContext('2d');
    sleepChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Hours of Sleep',
                data: [],
                backgroundColor: '#4b085f',
                borderColor: '#3f37c9',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Hours'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Sleep Hours (Last 7 Days)'
                }
            }
        }
    });
}

// Load sleep data for the last 7 days
async function loadSleepData() {
    try {
        const response = await fetch(`/api/sleep/weekly?user_id=${userId}`);
        const data = await response.json();

        // Create a map to store the latest entry for each day using ymd from backend
        const sleepMap = new Map();
        data.forEach(entry => {
            sleepMap.set(entry.ymd, entry.hours);
        });

        // Get the last 7 days starting from today (using local time)
        const labels = [];
        const hours = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const ymd = date.toISOString().split('T')[0];
            labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
            hours.push(sleepMap.get(ymd) || 0);
        }

        sleepChart.data.labels = labels;
        sleepChart.data.datasets[0].data = hours;
        sleepChart.update();
    } catch (error) {
        console.error('Error loading sleep data:', error);
    }
}
// Load sleep statistics
async function loadSleepStats() {
    try {
        const response = await fetch(`/api/sleep/stats?user_id=${userId}`);
        const stats = await response.json();

        avgSleepElement.textContent = `${stats.averageSleep.toFixed(1)}h`;
        sleepStreakElement.textContent = stats.sleepStreak;
        sleepGoalElement.textContent = `${stats.sleepGoal}h`;
    } catch (error) {
        console.error('Error loading sleep stats:', error);
    }
}

// Load sleep notes
async function loadSleepNotes() {
    try {
        const response = await fetch(`/api/sleep/notes?user_id=${userId}`);
        const data = await response.json();
        
        if (response.ok) {
            sleepNotes.value = data.notes || '';
        } else {
            console.error('Error loading notes:', data);
        }
    } catch (error) {
        console.error('Error loading sleep notes:', error);
    }
}

// Handle sleep form submission
sleepForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const sleepDate = document.getElementById('sleepDate').value;
    const sleepHours = parseFloat(document.getElementById('sleepHours').value);

    // Set the date input to today if no date is selected
    if (!sleepDate) {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('sleepDate').value = today;
    }

    const formData = {
        user_id: userId,
        date: document.getElementById('sleepDate').value,
        hours: sleepHours,
        notes: sleepNotes.value || '',
        quality: 3
    };

    console.log('Submitting sleep data:', formData);

    try {
        const response = await fetch('/api/sleep', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            // Reload data after successful submission
            loadSleepData();
            loadSleepStats();
            sleepForm.reset();
        } else {
            console.error('Error response:', data);
            alert(data.message || 'Error logging sleep');
        }
    } catch (error) {
        console.error('Error submitting sleep data:', error);
        alert('Error logging sleep');
    }
});

// Handle saving notes
saveNotesBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/sleep/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                user_id: userId,
                notes: sleepNotes.value 
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Notes saved successfully');
        } else {
            console.error('Error saving notes:', data);
            alert(data.message || 'Error saving notes');
        }
    } catch (error) {
        console.error('Error saving notes:', error);
        alert('Error saving notes');
    }
});

import React,{useEffect,useState} from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// const Calories_Burnt = () => {
//   const [data, setData] = useState([]);
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await fetch('http://localhost:5000/api/calTracker/last7days');
//         const result = await response.json();
//         console.log('Fetched data:', result); // Debug log
//         setData(result);
//       } catch (error) {
//         console.error('Error fetching fitness data:', error);
//       }
//     };
//     fetchData();
//   }, []);

const Calories_Burnt = () => {
  // Dummy data for daily calories burnt over a week
  const dailyCalories = [
    { day: 'Mon', calories: 300 },
    { day: 'Tue', calories: 450 },
    { day: 'Wed', calories: 500 },
    { day: 'Thu', calories: 350 },
    { day: 'Fri', calories: 600 },
    { day: 'Sat', calories: 700 },
    { day: 'Sun', calories: 400 },
  ];
  // Dummy current fitness level values
  const currentBMI = 24.5;
  const currentWeight = '62 kg';
  const currentMuscleMass = '30 kg';
  
  // Dummy goals
  const idealBMIRange = '18.5 - 24.9';
  const caloriesGoal = 500; // in kcal
  const idealWeight = '70 kg';
  const muscleMassGoal = '40 kg';

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>FitNest Dashboard</h1>

      <section style={{ marginBottom: '40px' }}>
        <h2>Current Fitness Level</h2>
        <ul>
          <li>
            <strong>BMI Level:</strong> {currentBMI}
          </li>
          <li>
            <strong>weight:</strong> {currentWeight}
          </li>
          <li>
            <strong>Muscle Mass:</strong> {currentMuscleMass}
          </li>
        </ul>
        <h3>Daily Calories Burnt</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyCalories}> 
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            {/* <XAxis
              dataKey="date"
              tickFormatter={(dateStr) => {
                const date = new Date(dateStr);
                return date.toLocaleDateString();
              }}
            /> */}
            <YAxis />
            <Tooltip
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString();
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="calories" stroke="#dda8fb" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section>
        <h2>Goals</h2>
        <ul>
          <li>
            <strong>Ideal BMI Range:</strong> {idealBMIRange}
          </li>
          <li>
            <strong>Calories Burnt Goal:</strong> {caloriesGoal} kcal
          </li>
          <li>
            <strong>Ideal Weight Goal:</strong> {idealWeight}
          </li>
          <li>
            <strong>Muscle Mass Goal:</strong> {muscleMassGoal}
          </li>
        </ul>
      </section>
    </div>
  );
};

export default Calories_Burnt;

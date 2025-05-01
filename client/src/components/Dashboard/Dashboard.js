import React, { useEffect, useState } from 'react';
import Sidebar from '../SideBar/SideBar';
import TopBar from '../TopBar/TopBar';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import './Dashboard.css';

export default function Dashboard() {
  const [calData, setCalData] = useState([]);
  const [stepData, setStepData] = useState([]);

  useEffect(() => {
    // TODO: fetch real data…
    setCalData([
      { day: 'Mon', calories: 400 },
      { day: 'Tue', calories: 500 },
      { day: "Wed", calories: 600 },
      { day: "Thu", calories: 550 },
      { day: "Fri", calories: 700 },
      { day: "Sat", calories: 450 },
      { day: "Sun", calories: 500 },
    ]);
    setStepData([
      { day: 'Mon', steps: 5000 },
      { day: "Tue", steps: 7000 },
      { day: "Wed", steps: 6500 },
      { day: "Thu", steps: 5200 },
      { day: "Fri", steps: 4000 },
      { day: "Sat", steps: 6300 },
      { day: "Sun", steps: 3020 },
    ]);
  }, []);

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="dashboard-main">
        <TopBar />

        <div className="content">
          <div className="cards-row">
            <div className="card large-card">
              <h3>Calorie Burnt</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={calData}>
                  <CartesianGrid stroke="#444" />
                  <XAxis dataKey="day" stroke="#ccc"/>
                  <YAxis stroke="#ccc"/>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#333' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line dataKey="calories" stroke={getComputedStyle(document.documentElement).getPropertyValue('--gradient-start')} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card large-card">
              <h3>Calorie Intake</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={calData}>
                  <CartesianGrid stroke="#444" />
                  <XAxis dataKey="day" stroke="#ccc"/>
                  <YAxis stroke="#ccc"/>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#333' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line dataKey="calories" stroke={getComputedStyle(document.documentElement).getPropertyValue('--gradient-end')} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="cards-row">
            <div className="card medium-card">
              <h3>Daily Step Count</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={stepData}>
                  <XAxis dataKey="day" stroke="#ccc"/>
                  <YAxis stroke="#ccc"/>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#333' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="steps" fill={getComputedStyle(document.documentElement).getPropertyValue('--gradient-start')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card medium-card stats-card">
              <h3>User Stats</h3>
              <ul>
                <li>Weight: 70kg</li>
                <li>BMI: 24.5</li>
                <li>Muscle Mass: 40kg</li>
                <li>Caloric Condition: Surplus</li>
              </ul>
            </div>
            <div className="card medium-card stats-card">
              <h3>Goal Stats</h3>
              <ul>
                <li>Weight: 65kg</li>
                <li>BMI: 22</li>
                <li>Muscle Mass: 42kg</li>
                <li>Caloric Condition: Deficit</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

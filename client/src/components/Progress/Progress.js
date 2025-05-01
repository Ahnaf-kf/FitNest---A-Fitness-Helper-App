import React, { useState, useEffect } from "react";
import "./Progress.css";
import Sidebar from '../SideBar/SideBar';
import TopBar from '../TopBar/TopBar';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function Progress() {

  // Dummy daily progress data
  const days = [
    { day: "Mon", pct: 100, date: "04/14" },
    { day: "Tue", pct: 25, date: "04/15" },
    { day: "Wed", pct: 0, date: "04/16" },
    { day: "Thu", pct: 0, date: "04/17" },
    { day: "Fri", pct: 0, date: "04/18" },
    { day: "Sat", pct: 0, date: "04/19" },
    { day: "Sun", pct: 0, date: "04/20" },
  ];

  // Dummy workouts
  const workouts = [
    { name: "Pull‑ups", done: true },
    { name: "Inclined Plank", done: true },
    { name: "Cable Bayesian Curl", done: false },
    { name: "Leg Raises", done: true },
  ];
  // Dummy cardio
  const cardio = {
    pct: 0,
    stepsdone: 2500,
    stepsneed: 6000,
    distdone: 2,
    distneed: 4,
    timedone: 25,
    timeneed: 180,
  };
  // Dummy overview
  const overview = {
    caloriesdone: 500,
    caloriesneed: 2500,
    waterdone: 1.5,
    waterneed: 3,
  };

  const intake = {
    calintakedone: 1800,
    calintakeneed: 2000,
    macros: {
      proteinpct: 22.5,
      carbspct: 55,
      fatpct: 22.5,
      fiberdone: 10,
      fiberneed: 30,
    },
  };

  return (
    <div className="dashboard-container">
          <Sidebar />

      <main className="dashboard-main">
          <TopBar />

        <div className="progress-days-bar">
          {days.map((d) => (
            <div key={d.day} className="day-cell">
              <div className="day-name">{d.day}</div>
              <div className="day-circle">
                <CircularProgressbar
                  value={d.pct}
                  text={`${d.pct}%`}
                  strokeWidth={8}
                  styles={buildStyles({
                  textSize: '32px',
                  textColor: '#fff',
                  pathColor: '#dda8fb',
                  trailColor: '#454545',
                  })}
                />
              </div>
              <div className="day-date">{d.date}</div>
            </div>
          ))}
        </div>

        <div className="progress-content">
          <div className="left-col">
            <div className="box">
              <div className="box-header">
                <h2>Daily Workout</h2>
                <div className="small-circle">
                  <CircularProgressbar
                    value={75}
                    text={`75%`}
                    strokeWidth={6}
                    styles={buildStyles({
                    textSize: '24px',
                    textColor: '#fff',
                    pathColor: '#dda8fb',
                    trailColor: '#555',
                    })}
                  />
                </div>
              </div>
              <ul className="workout-list">
                {workouts.map((w) => (
                  <li key={w.name}>
                    {w.name}{" "}
                    {w.done ? <span className="check">✓</span> : null}
                  </li>
                ))}
              </ul>
            </div>
            <div className="box">
              <div className="box-header">
                <h2>Daily Cardio</h2>
                <div className="small-circle">
                  <CircularProgressbar
                    value={cardio.pct}
                    text={`${cardio.pct}%`}
                    strokeWidth={6}
                    styles={buildStyles({
                    textSize: '24px',
                    textColor: '#fff',
                    pathColor: '#dda8fb',
                    trailColor: '#555',
                    })}
                  />
                </div>
              </div>
              <div className="cardio-details">
                <div>Steps: {cardio.stepsdone}/{cardio.stepsneed}</div>
                <div>Distance: {cardio.distdone}/{cardio.distneed} kms</div>
                <div>Active Time: {cardio.timedone}/{cardio.timeneed} mins</div>
              </div>
            </div>
          </div>

          <div className="right-col">
            <div className="box overview-box">
              <h2>Overview</h2>
              <div className="overview-details">
                <div>Steps: {cardio.stepsdone}/{cardio.stepsneed}</div>
                <div>Active Time: {cardio.timedone}/{cardio.timeneed} mins</div>
                <div>Calories Burnt: {overview.caloriesdone}/{overview.caloriesneed} kcal</div>
                <div>Water Intake: {overview.waterdone}/{overview.waterneed} ltrs</div>
                <div>Calorie Intaken: {intake.calintakedone}/{intake.calintakeneed}</div>
                <div className="macros">
                  <div>Protein: {(intake.calintakedone*(intake.macros.proteinpct/100))/4}/{(intake.calintakeneed*(intake.macros.proteinpct/100))/4} gms</div>
                  <div>Carb: {((intake.calintakedone*(intake.macros.carbspct/100))/4).toFixed(2)}/{(intake.calintakeneed*(intake.macros.carbspct/100))/4} gms</div>
                  <div>Fat: {(intake.calintakedone*(intake.macros.fatpct/100))/9}/{(intake.calintakeneed*(intake.macros.fatpct/100))/9} gms</div>
                  <div>Fiber: {intake.macros.fiberdone}/{intake.macros.fiberneed} gms</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


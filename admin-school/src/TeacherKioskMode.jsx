// TeacherKioskMode.jsx
// Frontend component untuk Classroom Attendance Kiosk Mode

import React, { useState, useRef, useEffect } from 'react';

const TeacherKioskMode = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [mode, setMode] = useState('auto'); // 'auto' or 'manual'
  const [isCapturing, setIsCapturing] = useState(false);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [status, setStatus] = useState('Select a session to begin');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureIntervalRef = useRef(null);

  // Fetch teacher's ongoing sessions
  useEffect(() => {
    fetchOngoingSessions();
  }, []);

  const fetchOngoingSessions = async () => {
    try {
      const response = await fetch('/api/users/sessions/last?status=ongoing', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSessions(data.data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Start webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus('🟢 Camera ready - Waiting for students...');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setStatus('❌ Cannot access camera. Please check permissions.');
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setStatus('Camera stopped');
    }
  };

  // Capture frame from video
  const captureFrame = () => {
    if (!canvasRef.current || !videoRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  // Send captured image to API
  const verifyAndMarkAttendance = async (imageBlob) => {
    if (!selectedSession) {
      alert('Please select a session first');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'capture.jpg');

      const response = await fetch(
        `/api/teacher/sessions/${selectedSession}/verify-attendance`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        }
      );

      const result = await response.json();

      if (result.success) {
        // Add to recent attendance list
        const newAttendance = {
          id: Date.now(),
          name: result.student.fullName,
          time: new Date().toLocaleTimeString(),
          confidence: result.confidence
        };
        
        setRecentAttendance(prev => [newAttendance, ...prev].slice(0, 10));
        setStatus(`✅ ${result.student.fullName} - Attendance Marked`);
        
        // Play success sound
        playSuccessSound();
        
        // Reset status after 2 seconds
        setTimeout(() => {
          setStatus('🟢 Waiting for students...');
        }, 2000);
      } else {
        // Face not recognized - silent in auto mode
        if (mode === 'manual') {
          setStatus(`❌ ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Error verifying face:', error);
      if (mode === 'manual') {
        setStatus('❌ Network error. Please try again.');
      }
    }
  };

  // Start auto capture mode
  const startAutoCapture = () => {
    if (!selectedSession) {
      alert('Please select a session first');
      return;
    }

    setIsCapturing(true);
    startCamera();

    // Capture every 3 seconds
    captureIntervalRef.current = setInterval(async () => {
      const imageBlob = await captureFrame();
      if (imageBlob) {
        await verifyAndMarkAttendance(imageBlob);
      }
    }, 3000);
  };

  // Stop auto capture mode
  const stopAutoCapture = () => {
    setIsCapturing(false);
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
    }
    stopCamera();
  };

  // Manual capture
  const handleManualCapture = async () => {
    const imageBlob = await captureFrame();
    if (imageBlob) {
      await verifyAndMarkAttendance(imageBlob);
    }
  };

  // Play success sound
  const playSuccessSound = () => {
    const audio = new Audio('/sounds/success.mp3');
    audio.play().catch(err => console.log('Audio play failed:', err));
  };

  return (
    <div className="kiosk-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>📹 Classroom Attendance Kiosk</h2>
      
      {/* Session Selection */}
      <div className="session-selection" style={{ marginBottom: '20px' }}>
        <label>
          <strong>Session:</strong>
          <select 
            value={selectedSession || ''} 
            onChange={(e) => setSelectedSession(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', fontSize: '16px' }}
          >
            <option value="">-- Select Session --</option>
            {sessions.map(session => (
              <option key={session.id} value={session.id}>
                {session.subject} - {session.class} ({session.startTime})
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Mode Selection */}
      <div className="mode-selection" style={{ marginBottom: '20px' }}>
        <label>
          <strong>Mode:</strong>
          <label style={{ marginLeft: '10px' }}>
            <input 
              type="radio" 
              value="auto" 
              checked={mode === 'auto'}
              onChange={(e) => setMode(e.target.value)}
              disabled={isCapturing}
            />
            Auto (Every 3s)
          </label>
          <label style={{ marginLeft: '10px' }}>
            <input 
              type="radio" 
              value="manual" 
              checked={mode === 'manual'}
              onChange={(e) => setMode(e.target.value)}
              disabled={isCapturing}
            />
            Manual
          </label>
        </label>
      </div>

      {/* Control Buttons */}
      <div className="controls" style={{ marginBottom: '20px' }}>
        {!isCapturing ? (
          <>
            {mode === 'auto' && (
              <button 
                onClick={startAutoCapture}
                style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px' }}
              >
                ▶️ Start Auto Capture
              </button>
            )}
            {mode === 'manual' && (
              <button 
                onClick={async () => {
                  await startCamera();
                }}
                style={{ padding: '10px 20px', fontSize: '16px' }}
              >
                📹 Start Camera
              </button>
            )}
          </>
        ) : (
          <button 
            onClick={stopAutoCapture}
            style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#dc3545', color: 'white' }}
          >
            ⏹️ Stop
          </button>
        )}
        
        {mode === 'manual' && videoRef.current?.srcObject && (
          <button 
            onClick={handleManualCapture}
            style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}
          >
            📸 Capture Now
          </button>
        )}
      </div>

      {/* Video Feed */}
      <div className="video-container" style={{ position: 'relative', marginBottom: '20px' }}>
        <video 
          ref={videoRef}
          autoPlay
          style={{ 
            width: '100%', 
            maxWidth: '640px', 
            border: '2px solid #333',
            borderRadius: '8px',
            backgroundColor: '#000'
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Status */}
      <div className="status" style={{ 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        {status}
      </div>

      {/* Recent Attendance */}
      <div className="recent-attendance">
        <h3>Recent Attendance</h3>
        {recentAttendance.length === 0 ? (
          <p style={{ color: '#666' }}>No attendance marked yet...</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {recentAttendance.map(att => (
              <li 
                key={att.id} 
                style={{ 
                  padding: '10px', 
                  backgroundColor: '#d4edda',
                  marginBottom: '5px',
                  borderRadius: '5px',
                  borderLeft: '4px solid #28a745'
                }}
              >
                ✅ <strong>{att.name}</strong> 
                <span style={{ marginLeft: '10px', color: '#666' }}>
                  {att.time}
                </span>
                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                  (Confidence: {(att.confidence * 100).toFixed(0)}%)
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TeacherKioskMode;

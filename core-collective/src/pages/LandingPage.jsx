import { useEffect, useState } from 'react';
import { MessageCircle, Mic, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    id: 'chat',
    title: 'Smart Chat',
    description: 'Get instant answers about courses, schedules, and campus life',
    icon: MessageCircle,
    color: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
    detail: 'AI-powered conversations'
  },
  {
    id: 'voice',
    title: 'Voice Assistant',
    description: 'Speak naturally and get voice responses on the go',
    icon: Mic,
    color: 'linear-gradient(135deg, #c084fc 0%, #9333ea 100%)',
    detail: 'Hands-free interaction'
  },
  {
    id: 'navigation',
    title: 'Campus Navigation',
    description: 'Find your way around campus with interactive maps',
    icon: MapPin,
    color: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
    detail: 'Never get lost again'
  }
];

const styles = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .feature-container {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 48px 16px;
    min-height: 100vh;
    display: flex;
    align-items: center;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: center;
    width: 100%;
  }

  .icon-section {
    position: relative;
    width: 100%;
    height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .center-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 160px;
    height: 160px;
    opacity: 0.2;
    border-radius: 50%;
    filter: blur(48px);
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    transition: background 1s ease-in-out;
  }

  .rotating-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transition: all 1s ease-in-out;
  }

  .icon-box {
    width: 112px;
    height: 112px;
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    transition: all 0.5s ease-in-out;
  }

  .icon-box.active {
    box-shadow: 0 0 40px rgba(96, 165, 250, 0.4);
  }

  .center-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 128px;
    height: 128px;
    border: 2px solid rgba(96, 165, 250, 0.2);
    border-radius: 50%;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .text-section {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .feature-title {
    font-size: 48px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 16px;
    transition: all 0.5s ease-in-out;
  }

  .feature-description {
    font-size: 20px;
    color: #64748b;
    line-height: 1.75;
    margin-bottom: 24px;
  }

  .feature-detail-box {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
  }

  .detail-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  .detail-text-small {
    font-size: 14px;
    color: #64748b;
  }

  .detail-text-large {
    font-size: 18px;
    font-weight: 600;
    color: #2563eb;
  }

  .indicators {
    display: flex;
    gap: 12px;
  }

  .indicator {
    height: 8px;
    border-radius: 9999px;
    transition: all 0.3s ease-in-out;
    border: none;
    cursor: pointer;
    background: #e2e8f0;
  }

  .indicator.active {
    width: 48px;
    background: #2563eb;
  }

  .indicator:not(.active) {
    width: 8px;
  }

  .indicator:not(.active):hover {
    background: #94a3b8;
  }

  .feature-list {
    display: grid;
    gap: 16px;
  }

  .feature-item {
    background: white;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(226, 232, 240, 0.5);
    transition: all 0.3s ease-in-out;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
  }

  .feature-item.active {
    border-color: #2563eb;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
  }

  .feature-item:not(.active):hover {
    border-color: #cbd5e1;
  }

  .feature-item-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .feature-item-title {
    font-weight: 600;
    color: #0f172a;
    font-size: 14px;
    flex: 1;
  }

  .active-dot {
    width: 8px;
    height: 8px;
    background: #2563eb;
    border-radius: 50%;
  }

  .cta-button {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 14px 28px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    width: 100%;
    margin-top: 24px;
  }

  .cta-button:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 6px 12px -1px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    .feature-grid {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    
    .icon-section {
      height: 350px;
    }
    
    .feature-title {
      font-size: 36px;
    }
  }
`;

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % features.length);
        setIsAnimating(false);
      }, 400);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleRouteToHome = () => {
    navigate('/login');
  };

  const activeFeature = features[activeIndex];
  const Icon = activeFeature.icon;

  return (
    <>
      <style>{styles}</style>
      <div className="feature-container">
        <div className="feature-grid">
          {/* Left side - Rotating icons */}
          <div className="icon-section">
            {/* Center glow effect */}
            <div 
              className="center-glow"
              style={{ background: activeFeature.color }}
            />
            
            {/* Rotating icons */}
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon;
              const isActive = index === activeIndex;
              const angle = (index * 120) - (activeIndex * 120);
              const radius = 120;
              
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              
              return (
                <div
                  key={feature.id}
                  className="rotating-icon"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${isActive ? 1.3 : 0.7})`,
                    opacity: isActive ? 1 : 0.3,
                  }}
                >
                  <div 
                    className={`icon-box ${isActive ? 'active' : ''}`}
                    style={{
                      background: feature.color,
                      transform: isActive ? 'rotate(0deg)' : 'rotate(15deg)',
                    }}
                  >
                    <FeatureIcon style={{ width: 56, height: 56, color: 'white', strokeWidth: 2 }} />
                  </div>
                </div>
              );
            })}

            {/* Center decorative ring */}
            <div className="center-ring" />
          </div>

          {/* Right side - Feature details */}
          <div className="text-section">
            <div 
              style={{
                transition: 'all 0.5s ease-in-out',
                opacity: isAnimating ? 0 : 1,
                transform: isAnimating ? 'translateX(20px)' : 'translateX(0)',
              }}
            >
              <h2 className="feature-title">
                {activeFeature.title}
              </h2>
              <p className="feature-description">
                {activeFeature.description}
              </p>
              
              <div className="feature-detail-box">
                <div 
                  className="detail-icon"
                  style={{ background: activeFeature.color }}
                >
                  <Icon style={{ width: 32, height: 32, color: 'white' }} />
                </div>
                <div>
                  <p className="detail-text-small">Feature</p>
                  <p className="detail-text-large">
                    {activeFeature.detail}
                  </p>
                </div>
              </div>

              {/* Feature indicators */}
              <div className="indicators">
                {features.map((feature, index) => (
                  <button
                    key={feature.id}
                    onClick={() => {
                      setIsAnimating(true);
                      setTimeout(() => {
                        setActiveIndex(index);
                        setIsAnimating(false);
                      }, 400);
                    }}
                    className={`indicator ${index === activeIndex ? 'active' : ''}`}
                    aria-label={`Switch to ${feature.title}`}
                  />
                ))}
              </div>
            </div>

            
            
            {/* Get Started Button */}
            <button className="cta-button" onClick={handleRouteToHome}>
              Get Started →
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
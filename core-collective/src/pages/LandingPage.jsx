import { useEffect, useState } from 'react';
import { MessageCircle, Mic, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogoTransbarentBlueOrange from '../../public/LogoTransbarentBlueOrange.png';
const features = [
  {
    id: 'chat',
    title: 'Smart Chat',
    description: 'Get instant answers about courses, ujenuis ,sports and campus life',
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

  .landing-page-wrapper {
    min-height: 0;
    height: calc(100vh - 32px);
    width: calc(100vw - 32px);
    background: #130c25;
    position: absolute;
    top: 15px;
    left: 16px;
    right: 16px;
    bottom: 16px;
    overflow: hidden;

    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.35),
      0 0 0 2px rgba(255,255,255,0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    border: 1.5px solid rgba(255,255,255,0.12);
    z-index: 10;
  }

  .landing-page-wrapper::before {
    /* Enhance the glow and depth for visibility */
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 24px;
    pointer-events: none;
    z-index: 2;
    box-shadow:
      0 0 80px 10px rgba(96,165,250,0.08),
      0 0 120px 30px rgba(96,165,250,0.04);
  }

  .landing-page-wrapper::after {
    content: '';
    position: absolute;
    top: 10%;
    right: 10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(40px);
    pointer-events: none;
    z-index: 1;
  }

  @keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(-20px, -20px) rotate(120deg); }
    66% { transform: translate(20px, -10px) rotate(240deg); }
  }

  .feature-container {
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    padding: 64px 32px;
    min-height: 90vh;
    display: flex;
    align-items: center;
    position: relative;
    z-index: 2;
    top: 72px; 
    left:20px;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: center;
    width: 100%;
    background: #130c25;
    backdrop-filter: blur(20px);
    border: none;
    border-radius: 24px;
    padding: 60px;
    position: relative;
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.35),
      0 0 0 2px rgba(251, 251, 251, 0.18),
      0 4px 24px 0 rgba(96,165,250,0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }

  .feature-grid::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 24px;
    padding: 2px;
    background: none;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: xor;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    z-index: -1;
  }

  .feature-grid::after {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    border-radius: 24px;
    background: none;
    filter: blur(1px);
    z-index: -2;
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
    border: 2px solid rgba(96, 165, 250, 0.4);
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
    color: #f8fafc;
    margin-bottom: 16px;
    transition: all 0.5s ease-in-out;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .feature-description {
    font-size: 20px;
    color: #cbd5e1;
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
    color: #94a3b8;
  }

  .detail-text-large {
    font-size: 18px;
    font-weight: 600;
    color: #60a5fa;
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
    background: rgba(255, 255, 255, 0.2);
  }

  .indicator.active {
    width: 2px;
    background: #60a5fa;
  }

  .indicator:not(.active) {
    width: 8px;
  }

  .indicator:not(.active):hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .active-dot {
    width: 8px;
    height: 8px;
    background: #60a5fa;
    border-radius: 50%;
  }

  .feature-list {
    display: grid;
    gap: 16px;
  }

  .feature-item {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 16px;
    border: none;
    transition: all 0.3s ease-in-out;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    position: relative;
    overflow: hidden;
  }

  .feature-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    padding: 1px;
    background: 
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.2) 0%, transparent 40%),
      radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.15) 0%, transparent 40%),
      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.1) 100%);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: xor;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    z-index: -1;
    opacity: 0.6;
  }

  .feature-item.active {
    background: rgba(96, 165, 250, 0.1);
    box-shadow: 0 4px 12px rgba(96, 165, 250, 0.2);
  }

  .feature-item.active::before {
    background: 
      radial-gradient(circle at top left, rgba(37, 12, 75, 0.4) 0%, transparent 40%),
      radial-gradient(circle at bottom right, rgba(96, 165, 250, 0.3) 0%, transparent 40%),
      linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(96, 165, 250, 0.1) 50%, rgba(96, 165, 250, 0.2) 100%);
    opacity: 1;
  }

  .feature-item:not(.active):hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .feature-item:not(.active):hover::before {
    opacity: 0.8;
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
    color: #f1f5f9;
    font-size: 14px;
    flex: 1;
  }

  .active-dot {
    width: 22px;
    height: 10px;
    background: #2563eb;
    border-radius: 50%;
  }

  .cta-button {
    background: rgb(233, 124, 70);
    color: white;
    border: none;
    border-radius: 24px;
    padding: 10px 32px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    width: auto;
    margin: 32px auto 42px 16px;
    display: block;
    
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
      position: relative;
      right: 40px;
    }
    
    .icon-section {
      height: 350px;
    }
    
    .feature-title {
      font-size: 36px;
    }
  }

  .landing-page-logo {
    height: 200px;
    width: auto;
    border-radius: 36px;
    
    position: relative;
    left: -16px; /* Move logo to the left */
    top: 0;
    background: none;
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
      <div className="landing-page-wrapper">
        {/* Logo at the top left, updated version */}
        <div style={{ position: 'absolute', top: 24, left: 32, zIndex: 200 }}>
          <img src={LogoTransbarentBlueOrange} alt="VirtualAssist Logo" className="landing-page-logo" />
        </div>
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
            <button className="cta-button" onClick={handleRouteToHome}>
              Get Started 
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default LandingPage;
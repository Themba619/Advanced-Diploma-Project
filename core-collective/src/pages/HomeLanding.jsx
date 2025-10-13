import React, { useState, useEffect, useRef } from 'react';
import Logo from '../assets/Logo.png';

const HomeLanding = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsVisible, setCardsVisible] = useState([false, false, false, false]);
  const [cardsFrontSequence, setCardsFrontSequence] = useState(-1);
  const [userInteracted, setUserInteracted] = useState(false);
  const [finalCardsVisible, setFinalCardsVisible] = useState([false, false, false, false]);
  const animationRef = useRef(null);

  // Background images and content for each card
  // PASTE YOUR ONLINE IMAGE LINKS BELOW:
  const backgrounds = [
    // AI Chat Bot - Paste your AI/Technology image link here:
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    
    // Voice Chat - ADD YOUR VOICE CHAT IMAGE HERE:
    '/src/assets/voicechat.jpg',
    
    // Chat Forum - Chat platform/messaging interface:
    'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    
    // Smart Navigation - ADD YOUR UJ CAMPUS IMAGE HERE:
    '/src/assets/sthbuilding3updated.jpg'
  ];

  // Expanded content for each card
  const expandedContents = [
    {
      title: "AI Chat Bot",
      description: "Our intelligent AI assistant is available 24/7 to answer your questions, provide information, and help with tasks. It learns from interactions to provide increasingly accurate and helpful responses.",
      features: [
        "Natural language processing",
        "Context-aware conversations",
        "Multi-language support",
        "Continuous learning from interactions"
      ]
    },
    {
      title: "Voice Chat",
      description: "Experience crystal-clear voice communication with advanced noise cancellation and real-time translation features. Connect with anyone, anywhere with exceptional audio quality.",
      features: [
        "Advanced noise cancellation",
        "Real-time voice translation",
        "High-quality audio codecs",
        "Group voice channels"
      ]
    },
    {
      title: "Chat Forum",
      description: "Join community-driven discussions with advanced topic categorization and moderation tools. Share knowledge, ask questions, and connect with like-minded people.",
      features: [
        "Topic-based categorization",
        "Advanced moderation tools",
        "Rich media support",
        "User reputation system"
      ]
    },
    {
      title: "Smart Navigation",
      description: "Navigate the app effortlessly with our intelligent interface that provides smart suggestions and personalized content discovery based on your preferences and usage patterns.",
      features: [
        "Personalized content discovery",
        "Intelligent search suggestions",
        "Usage pattern analysis",
        "Quick access to frequent features"
      ]
    }
  ];

  const cardData = [
    { icon: "🤖", title: "AI Chat Bot", image: backgrounds[0] },
    { icon: "🎤", title: "Voice Chat", image: backgrounds[1] },
    { icon: "💬", title: "Chat Forum", image: backgrounds[2] },
    { icon: "🗺️", title: "Smart Navigation", image: backgrounds[3] }
  ];

  useEffect(() => {
    if (userInteracted) return; // Stop animation if user has interacted

    // Continuous sequential card animation loop
    const runContinuousSequence = () => {
      let cycleIndex = 0;
      
      const runSingleCycle = () => {
        cardData.forEach((_, index) => {
          const startTime = index * 3000; // 3 seconds between each card
          
          // Step 1: Card slides in from the right
          animationRef.current = setTimeout(() => {
            if (userInteracted) return;
            setCardsVisible(prev => {
              const newVisible = [...prev];
              newVisible[index] = true;
              return newVisible;
            });
          }, startTime + 500);
          
          // Step 2: Card becomes "front" and background changes
          animationRef.current = setTimeout(() => {
            if (userInteracted) return;
            setCardsFrontSequence(index);
            setCurrentIndex(index);
          }, startTime + 1000);
          
          // Step 3: Card disappears (except during final cycle)
          if (index < cardData.length - 1) {
            animationRef.current = setTimeout(() => {
              if (userInteracted) return;
              setCardsVisible(prev => {
                const newVisible = [...prev];
                newVisible[index] = false;
                return newVisible;
              });
            }, startTime + 2500);
          }
        });
        
        // After one complete cycle, start the next one
        animationRef.current = setTimeout(() => {
          if (userInteracted) return;
          // Reset all cards for next cycle
          setCardsVisible([false, false, false, false]);
          setCardsFrontSequence(-1);
          cycleIndex++;
          runSingleCycle(); // Recursive call for continuous loop
        }, cardData.length * 3000);
      };
      
      // Start the first cycle
      runSingleCycle();
    };

    const initialTimer = setTimeout(runContinuousSequence, 800);
    
    return () => {
      clearTimeout(initialTimer);
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [userInteracted, cardData.length]);

  // Handle user interaction - stop animation and show all cards
  const handleUserInteraction = (index) => {
    if (!userInteracted) {
      setUserInteracted(true);
      // Clear any pending animations
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      // Show all cards immediately
      setFinalCardsVisible([true, true, true, true]);
      setCardsVisible([false, false, false, false]); // Hide sequence cards
      setCardsFrontSequence(-1); // No front card during manual mode
    }
    setCurrentIndex(index);
  };

  // Manual navigation functions (only work after user interaction)
  const goToPrevious = () => {
    if (userInteracted) {
      setCurrentIndex(prev => prev === 0 ? cardData.length - 1 : prev - 1);
    }
  };

  const goToNext = () => {
    if (userInteracted) {
      setCurrentIndex(prev => (prev + 1) % cardData.length);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white',
      overflowX: 'hidden',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      position: 'relative'
    },
    innerContainer: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 0',
      position: 'relative',
      zIndex: 100
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '28px',
      fontWeight: '800',
      letterSpacing: '1px',
      color: '#6c63ff'
    },
    logoIcon: {
      fontSize: '32px'
    },
    nav: {
      display: 'flex',
      listStyle: 'none',
      margin: 0,
      padding: 0
    },
    navItem: {
      marginLeft: '30px'
    },
    navLink: {
      color: 'white',
      textDecoration: 'none',
      fontWeight: '500',
      transition: 'color 0.3s',
      position: 'relative'
    },
    hero: {
      position: 'absolute',
      bottom: '100px',
      left: '50px',
      maxWidth: '600px',
      zIndex: 50
    },
    heroTitle: {
      fontSize: '52px',
      marginBottom: '20px',
      lineHeight: '1.2',
      background: 'linear-gradient(90deg, #6c63ff, #a363ff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    heroDescription: {
      fontSize: '18px',
      lineHeight: '1.6',
      marginBottom: '30px',
      color: '#b8b8d1'
    },
    btn: {
      display: 'inline-block',
      background: 'linear-gradient(90deg, #6c63ff, #8a63ff)',
      color: 'white',
      padding: '12px 30px',
      borderRadius: '30px',
      textDecoration: 'none',
      fontWeight: '600',
      transition: 'all 0.3s',
      boxShadow: '0 4px 15px rgba(108, 99, 255, 0.3)',
      border: 'none',
      cursor: 'pointer'
    },
    cardsSection: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 10,
      pointerEvents: 'none'
    },
    cardsContainer: {
      position: 'absolute',
      bottom: '50px',
      right: '50px',
      display: 'flex',
      gap: '15px',
      alignItems: 'flex-end',
      pointerEvents: 'auto'
    },
    card: {
      width: '200px',
      height: '250px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px',
      overflow: 'hidden',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
      cursor: 'pointer',
      transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)',
      flexShrink: 0,
      position: 'relative',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      opacity: 0,
      transform: 'translateX(100px) scale(0.8)',
      pointerEvents: 'auto' // Always allow clicks to stop animation
    },
    cardVisible: {
      opacity: 1,
      transform: 'translateX(0) scale(1)'
    },
    cardFront: {
      transform: 'scale(1.2)',
      boxShadow: '0 25px 60px rgba(108, 99, 255, 0.6)',
      background: 'rgba(255, 255, 255, 0.25)',
      border: '3px solid rgba(108, 99, 255, 0.8)',
      zIndex: 20
    },
    cardActive: {
      transform: 'scale(1.1)',
      boxShadow: '0 20px 50px rgba(108, 99, 255, 0.4)',
      background: 'rgba(255, 255, 255, 0.2)',
      border: '2px solid rgba(108, 99, 255, 0.5)',
      zIndex: 10
    },
    cardIcon: {
      position: 'absolute',
      top: '15px',
      left: '15px',
      width: '40px',
      height: '40px',
      background: 'rgba(108, 99, 255, 0.2)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      color: '#6c63ff',
      zIndex: 2
    },
    cardImage: {
      width: '90%',
      height: '90%',
      objectFit: 'cover',
      transition: 'transform 0.5s'
    },
    cardTitle: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
      padding: '20px 15px 15px',
      textAlign: 'center'
    },
    cardNumber: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      background: 'rgba(0, 0, 0, 0.6)',
      width: '25px',
      height: '25px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '12px',
      color: '#6c63ff',
      zIndex: 2
    },
    expandedBackground: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1,
      opacity: 1,
      transition: 'all 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
      backgroundSize: '100%',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      imageRendering: 'smooth',
      backgroundImage: `url('${backgrounds[currentIndex]}')`,
      filter: 'brightness(0.7) contrast(1.1)'
    },
    expandedContent: {
      position: 'absolute',
      bottom: '150px',
      left: '100px',
      maxWidth: '500px',
      background: 'rgba(26, 26, 46, 0.9)',
      padding: '30px',
      borderRadius: '15px',
      backdropFilter: 'blur(15px)',
      transform: 'translateY(0)',
      opacity: 1,
      transition: 'all 1s cubic-bezier(0.23, 1, 0.32, 1)',
      borderLeft: '4px solid #6c63ff',
      border: '1px solid rgba(108, 99, 255, 0.3)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
    },
    expandedTitle: {
      fontSize: '32px',
      marginBottom: '15px',
      color: '#6c63ff'
    },
    expandedDescription: {
      fontSize: '16px',
      lineHeight: '1.6',
      marginBottom: '20px'
    },
    featuresList: {
      listStyle: 'none',
      marginTop: '20px',
      padding: 0
    },
    featuresListItem: {
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center'
    },
    featuresIcon: {
      color: '#6c63ff',
      marginRight: '10px',
      fontSize: '14px'
    },
    navigation: {
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '15px',
      zIndex: 100,
      alignItems: 'center'
    },
    navBtn: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.5)',
      cursor: 'pointer',
      transition: 'all 0.3s',
      border: 'none'
    },
    navBtnActive: {
      background: '#6c63ff',
      transform: 'scale(1.2)'
    },
    arrowBtn: {
      background: 'rgba(108, 99, 255, 0.2)',
      border: '1px solid rgba(108, 99, 255, 0.5)',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s',
      color: '#6c63ff',
      fontSize: '18px',
      fontWeight: 'bold',
      backdropFilter: 'blur(10px)'
    },
    arrowBtnDisabled: {
      opacity: 0.3,
      cursor: 'not-allowed'
    }
  };

  return (
    <div style={styles.container}>
     

      {/* Expanded Background Content */}
      <div style={styles.expandedBackground} />
      
      <div style={styles.expandedContent}>
        <h2 style={styles.expandedTitle}>{expandedContents[currentIndex].title}</h2>
        <p style={styles.expandedDescription}>{expandedContents[currentIndex].description}</p>
        <ul style={styles.featuresList}>
          {expandedContents[currentIndex].features.map((feature, index) => (
            <li key={index} style={styles.featuresListItem}>
              <span style={styles.featuresIcon}>✓</span> {feature}
            </li>
          ))}
        </ul>
      </div>

      <div style={styles.innerContainer}>
       

        <section style={styles.hero}>
          <h1 style={styles.heroTitle}>Intelligent Communication Made Simple</h1>
          <p style={styles.heroDescription}>
            VirtualAssist combines advanced AI, voice technology, community forums, and smart navigation to create the ultimate communication platform. Connect, communicate, and collaborate like never before.
          </p>
          {/* <button style={styles.btn}>Get Started</button> */}
        </section>
      </div>

      <div style={styles.cardsSection}>
        <div style={styles.cardsContainer}>
          {cardData.map((card, index) => {
            let cardStyle = { ...styles.card };
            
            if (!userInteracted) {
              // During continuous animation sequence
              if (cardsVisible[index]) {
                cardStyle = { ...cardStyle, ...styles.cardVisible };
              }
              
              // Special styling for the "front" card during sequence
              if (index === cardsFrontSequence) {
                cardStyle = { ...cardStyle, ...styles.cardFront };
              }
            } else {
              // After user interaction, show all cards and highlight active one
              if (finalCardsVisible[index]) {
                cardStyle = { ...cardStyle, ...styles.cardVisible };
              }
              
              if (index === currentIndex) {
                cardStyle = { ...cardStyle, ...styles.cardActive };
              }
            }

            return (
              <div
                key={index}
                style={cardStyle}
                onClick={() => handleUserInteraction(index)}
              >
                <div style={styles.cardIcon}>
                  {card.icon}
                </div>
                <div style={styles.cardNumber}>{index + 1}</div>
                <img src={card.image} alt={card.title} style={styles.cardImage} />
                <div style={styles.cardTitle}>
                  <h3 style={{ fontSize: '18px', color: 'white', textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)', margin: 0 }}>
                    {card.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.navigation}>
        <button
          style={{
            ...styles.arrowBtn,
            ...(userInteracted ? {} : styles.arrowBtnDisabled)
          }}
          onClick={goToPrevious}
          disabled={!userInteracted}
        >
          ‹
        </button>
        
        {cardData.map((_, index) => (
          <button
            key={index}
            style={{
              ...styles.navBtn,
              ...(currentIndex === index ? styles.navBtnActive : {})
            }}
            onClick={() => handleUserInteraction(index)}
          />
        ))}
        
        <button
          style={{
            ...styles.arrowBtn,
            ...(userInteracted ? {} : styles.arrowBtnDisabled)
          }}
          onClick={goToNext}
          disabled={!userInteracted}
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default HomeLanding;
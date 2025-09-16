import React, { useEffect, useState } from 'react';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import './styles.css';

const MaintenancePage: React.FC = () => {
  const [dots, setDots] = useState('');
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseScale(prev => prev === 1 ? 1.05 : 1);
    }, 2000);

    return () => clearInterval(pulseInterval);
  }, []);

  return (
    <BackgroundGradient className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-200">
      <div className="maintenance-card">
        <div className="maintenance-glow"></div>
        
        <div className="maintenance-content">
          <div className="maintenance-icon-wrapper">
            <div className="maintenance-icon">
              <svg 
                width="80" 
                height="80" 
                viewBox="0 0 24 24" 
                fill="none"
                className="maintenance-gear"
              >
                <path
                  d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 2V4M12 20V22M4 12H2M22 12H20M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="maintenance-spinner"></div>
            </div>
          </div>
          
          <h1 className="maintenance-title" style={{ transform: `scale(${pulseScale})` }}>
            Em Atualização{dots}
          </h1>
          
          <p className="maintenance-description">
            Estamos melhorando nossa plataforma para você
          </p>
          
          <div className="maintenance-progress">
            <div className="maintenance-progress-bar">
              <div className="maintenance-progress-fill"></div>
            </div>
          </div>
          
          <div className="maintenance-info">
            <span className="maintenance-info-text">
              Contato de Suporte
            </span>
          </div>
          
          <a 
            href="https://wa.me/5562999212484" 
            target="_blank" 
            rel="noopener noreferrer"
            className="maintenance-whatsapp-btn"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              className="maintenance-whatsapp-icon"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 20.2A1.01 1.01 0 0 0 3.8 21.454l3.032-.892A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.948 7.948 0 0 1-4.266-1.238l-.306-.184-3.152.928.93-3.152-.2-.32A7.946 7.946 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
            </svg>
            <span className="maintenance-whatsapp-text">
              62 99921-2484
            </span>
          </a>
        </div>
        
        <div className="maintenance-particles">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`maintenance-particle particle-${i + 1}`}></div>
          ))}
        </div>
      </div>
    </BackgroundGradient>
  );
};

export default MaintenancePage;
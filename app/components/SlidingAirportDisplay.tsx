import { useState, useEffect } from 'react';

const LINE_HEIGHT = 32; // px – increased for more vertical space
const VISIBLE_LINES = 4; // show more lines for more height
const CONTAINER_HEIGHT = LINE_HEIGHT * VISIBLE_LINES;

interface SlidingAirportDisplayProps {
  debug?: boolean;
  first?: string[];
  second?: string;
  third?: string[];
}

const SlidingAirportDisplay = ({ 
  debug = false, 
  first: propFirst, 
  second: propSecond, 
  third: propThird 
}: SlidingAirportDisplayProps) => {
  // Use props when provided, otherwise use internal state
  const [first, setFirst] = useState(propFirst || [
    "computer science was invented by", 
    "the Turing machine was created by", 
    "artificial intelligence was pioneered by",
    "the foundations of computing were laid by"
  ]);
  
  const [second, setSecond] = useState(propSecond || "Alan Turing");
  
  const [third, setThird] = useState(propThird || [
    "contributed to cryptology during WW2",
    "broke the Enigma code",
    "developed the concept of algorithms",
    "laid groundwork for modern computers"
  ]);
  
  // Update state when props change
  useEffect(() => {
    if (propFirst) setFirst(propFirst);
  }, [propFirst]);
  
  useEffect(() => {
    if (propSecond) setSecond(propSecond);
  }, [propSecond]);
  
  useEffect(() => {
    if (propThird) setThird(propThird);
  }, [propThird]);
  
  const [firstInput, setFirstInput] = useState(first.join('\n'));
  const [secondInput, setSecondInput] = useState(second);
  const [thirdInput, setThirdInput] = useState(third.join('\n'));
  const [speed, setSpeed] = useState(3000);
  const [animationDuration, setAnimationDuration] = useState(700);
  const [easingParams, setEasingParams] = useState({
    x1: 0.25,
    y1: 0.46,
    x2: 0.45,
    y2: 0.94
  });
  
  const [currentFirstIndex, setCurrentFirstIndex] = useState(0);
  const [currentThirdIndex, setCurrentThirdIndex] = useState(0);
  const [showingFirst, setShowingFirst] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  const handleInputChange = () => {
    setFirst(firstInput.split('\n').filter(line => line.trim()));
    setThird(thirdInput.split('\n').filter(line => line.trim()));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTransitioning(true);
      
      setTimeout(() => {
        if (showingFirst) {
          setCurrentThirdIndex((prev) => (prev + 1) % third.length);
        } else {
          setCurrentFirstIndex((prev) => (prev + 1) % first.length);
        }
        setShowingFirst(!showingFirst);
        setTransitioning(false);
      }, 350);
    }, speed);

    return () => clearInterval(interval);
  }, [showingFirst, first.length, third.length, speed]);

  return (
    <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 p-1 w-full min-h-24">
      {debug && (
        <div className="mb-8 w-full max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 text-center mb-6">
            Configurable Display
          </h1>
          
          {/* Configuration inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-200 text-sm font-mono mb-2">
                First phrases (one per line):
              </label>
<textarea
  value={firstInput}
  onChange={(e) => setFirstInput(e.target.value)}
  onBlur={handleInputChange}
  className="w-full h-24 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 font-mono text-sm resize-none"
  placeholder="Enter phrases, one per line"
></textarea>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-mono mb-2">
                Fixed middle text:
              </label>
              <input
                type="text"
                value={secondInput}
                onChange={(e) => setSecondInput(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 font-mono text-sm"
                placeholder="Fixed text"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-mono mb-2">
                Third phrases (one per line):
              </label>
<textarea
  value={thirdInput}
  onChange={(e) => setThirdInput(e.target.value)}
  onBlur={handleInputChange}
  className="w-full h-24 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 font-mono text-sm resize-none"
  placeholder="Enter phrases, one per line"
></textarea>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-mono mb-2">
                Speed (milliseconds):
              </label>
              <input
                type="number"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value) || 2000)}
                min="500"
                max="10000"
                step="100"
                className="w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 font-mono text-sm"
                placeholder="2000"
              />
              
              <label className="block text-gray-700 text-sm font-mono mb-2">
                Animation Duration (ms):
              </label>
              <input
                type="number"
                value={animationDuration}
                onChange={(e) => setAnimationDuration(parseInt(e.target.value) || 700)}
                min="200"
                max="2000"
                step="50"
                className="w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 font-mono text-sm"
                placeholder="700"
              />
            </div>
          </div>
          
          {/* Animation Easing Controls */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded">
            <h3 className="text-gray-800 dark:text-gray-200 font-mono text-lg mb-3">Animation Easing (Cubic Bezier)</h3>
            
            {/* Preset Buttons */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-mono mb-2">Quick Presets:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setEasingParams({ x1: 0.25, y1: 0.46, x2: 0.45, y2: 0.94 })}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 font-mono text-sm rounded transition-colors"
                >
                  Smooth (Default)
                </button>
                <button
                  onClick={() => setEasingParams({ x1: 0.68, y1: -0.55, x2: 0.265, y2: 1.55 })}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 font-mono text-sm rounded transition-colors"
                >
                  Bouncy
                </button>
                <button
                  onClick={() => setEasingParams({ x1: 0.4, y1: 0, x2: 0.6, y2: 1 })}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 font-mono text-sm rounded transition-colors"
                >
                  Sharp
                </button>
                <button
                  onClick={() => setEasingParams({ x1: 0.175, y1: 0.885, x2: 0.32, y2: 1.275 })}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 font-mono text-sm rounded transition-colors"
                >
                  Elastic
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <label className="block text-gray-700 text-xs font-mono mb-1">X1 (Start curve)</label>
                <input
                  type="number"
                  value={easingParams.x1}
                  onChange={(e) => setEasingParams({...easingParams, x1: parseFloat(e.target.value) || 0})}
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 p-1 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-xs font-mono mb-1">Y1 (Start speed)</label>
                <input
                  type="number"
                  value={easingParams.y1}
                  onChange={(e) => setEasingParams({...easingParams, y1: parseFloat(e.target.value) || 0})}
                  min="-1"
                  max="2"
                  step="0.01"
                  className="w-full bg-white text-gray-700 border border-gray-300 p-1 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-xs font-mono mb-1">X2 (End curve)</label>
                <input
                  type="number"
                  value={easingParams.x2}
                  onChange={(e) => setEasingParams({...easingParams, x2: parseFloat(e.target.value) || 0})}
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full bg-white text-gray-700 border border-gray-300 p-1 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-xs font-mono mb-1">Y2 (End speed)</label>
                <input
                  type="number"
                  value={easingParams.y2}
                  onChange={(e) => setEasingParams({...easingParams, y2: parseFloat(e.target.value) || 0})}
                  min="-1"
                  max="2"
                  step="0.01"
                  className="w-full bg-white text-gray-700 border border-gray-300 p-1 font-mono text-xs"
                />
              </div>
            </div>
            <div className="text-gray-600 text-xs font-mono">
              <p className="mb-1"><strong>Current:</strong> cubic-bezier({easingParams.x1}, {easingParams.y1}, {easingParams.x2}, {easingParams.y2})</p>
              <p className="mb-1"><strong>X1/Y1:</strong> Control how the animation starts (0,0 = slow start, 1,1 = fast start)</p>
              <p><strong>X2/Y2:</strong> Control how the animation ends (0,0 = slow end, 1,1 = fast end)</p>
            </div>
          </div>
        </div>
      )}
      
        {/* Actual Display Area */}    
      <div className="flex items-baseline justify-center text-lg w-full mx-auto space-x-2 overflow-hidden min-h-24" style={{height: `${CONTAINER_HEIGHT}px`}}>
        {/* First element with slide animation */}
        <div 
          className="text-gray-800 dark:text-gray-100 font-mono text-base text-right transition-all transform flex-1"
          style={{
            minWidth: 0,
            flexBasis: 0,
            transform: showingFirst && !transitioning ? 'translateY(0px)' : 
                      transitioning && showingFirst ? `translateY(${LINE_HEIGHT}px)` :
                      transitioning && !showingFirst ? `translateY(-${LINE_HEIGHT}px)` : `translateY(${LINE_HEIGHT}px)`,
            opacity: showingFirst ? 1 : 0,
            transitionDuration: `${animationDuration}ms`,
            transitionTimingFunction: `cubic-bezier(${easingParams.x1}, ${easingParams.y1}, ${easingParams.x2}, ${easingParams.y2})`
          }}
        >
          {first[currentFirstIndex]}
        </div>
        
        {/* Second element - always visible and FLEXIBLE WIDTH */}
        <div 
          className="text-gray-800 dark:text-gray-200 font-mono text-base text-center flex-shrink-0 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded"
          style={{ 
            minWidth: '140px',
            maxWidth: '240px'
          }}
        >
          {second}
        </div>
        
        {/* Third element with slide animation */}
        <div 
          className="text-gray-800 dark:text-gray-100 font-mono text-base text-left transition-all transform flex-1"
          style={{
            minWidth: 0,
            flexBasis: 0,
            transform: !showingFirst && !transitioning ? 'translateY(0px)' : 
                      transitioning && !showingFirst ? `translateY(${LINE_HEIGHT}px)` :
                      transitioning && showingFirst ? `translateY(-${LINE_HEIGHT}px)` : `translateY(${LINE_HEIGHT}px)`,
            opacity: !showingFirst ? 1 : 0,
            transitionDuration: `${animationDuration}ms`,
            transitionTimingFunction: `cubic-bezier(${easingParams.x1}, ${easingParams.y1}, ${easingParams.x2}, ${easingParams.y2})`
          }}
        >
          {third[currentThirdIndex]}
        </div>
      </div>
      

    </div>
  );
};

export default SlidingAirportDisplay;

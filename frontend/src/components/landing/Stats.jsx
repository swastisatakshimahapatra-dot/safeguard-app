import { useEffect, useRef, useState } from "react";

const statsData = [
  {
    number: 10000,
    suffix: "+",
    label: "Users Protected",
    color: "text-pink-400",
  },
  {
    number: 30,
    prefix: "< ",
    suffix: "s",
    label: "Avg Response Time",
    color: "text-purple-400",
  },
  {
    number: 200,
    suffix: "m",
    label: "Community Radius",
    color: "text-blue-400",
  },
  {
    number: 99,
    suffix: "%",
    label: "Alert Delivery Rate",
    color: "text-green-400",
  },
];

const Counter = ({ number, suffix, prefix }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const duration = 2000;
    const increment = number / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= number) {
        setCount(number);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, number]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const Stats = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">
            Trusted by Thousands
          </h2>
          <p className="text-gray-400">Real numbers, Real protection</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div
                className={`text-4xl sm:text-5xl font-bold ${stat.color} mb-2`}
              >
                <Counter
                  number={stat.number}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                />
              </div>
              <div className="text-gray-400 text-sm font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;

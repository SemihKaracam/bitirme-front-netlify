import React from "react";
import { Chart as ChartJS, defaults } from "chart.js/auto";
import "../App.css";
import { useNavigate } from "react-router-dom";
import grafik1 from "../assets/grafik1.jpg"
import grafik2 from "../assets/grafik2.jpg"
import grafik3 from "../assets/grafik3.jpg"
import grafik4 from "../assets/grafik4.jpg"
import grafik5 from "../assets/grafik5.jpg"
defaults.maintainAspectRatio = false;
defaults.responsive = true;

defaults.plugins.title.display = true;
defaults.plugins.title.align = "start";
defaults.plugins.title.font = { size: 20 };
defaults.plugins.title.color = "black";

const GrafikPage = () => {
  const handleNavigate = () => {
    navigate("/")
  }
  const navigate = useNavigate()

  return (
    <div className="p-12">
      <button onClick={handleNavigate} className="upload-btn">Test Ekranı</button>
      <div className="mt-8">
        <h3 className="text-2xl text-blue-500 font-bold">Modelin Performans Çıktıları</h3>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 auto-rows-fr justify-items-center">
          {[grafik1, grafik5, grafik4, grafik2].map((src, i) => (
            <div key={i} className="shadow-xl p-4 bg-body rounded">
              <img className="w-full h-full object-cover" src={src} alt={`grafik ${i + 1}`} />
            </div>
          ))}

          {/* Son eleman yatayda tamamını kaplasın */}
          <div className="w-full p-4 bg-body rounded shadow-lg overflow-hidden col-span-1 sm:col-span-2">
            <img
              className="w-full h-full object-cover"
              src={grafik3}
              alt="grafik 5"
            />
          </div>

        </div>

      </div>
    </div>
  );
};

export default GrafikPage
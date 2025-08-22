import { useState, useEffect } from "react";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  listAll,
  getMetadata,
  deleteObject
} from "firebase/storage";
import { storage } from "../firebase.ts";
import { v4 } from "uuid";
import { ClipLoader } from "react-spinners";
import moment from "moment";
// import "moment/locale/tr";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaCircleCheck } from "react-icons/fa6";
import { IoMdCloseCircle } from "react-icons/io";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import heatmap from "../assets/heatmap.png";

type YapayZekaResponse = {
  prediction: number[];
  predictionTime?: number;
  loadTime?: number;
  [key: string]: any;
};

const apiUrl = import.meta.env.VITE_API_URL;

function HomePage() {

  const [imageUpload, setImageUpload] = useState<File | null>(null);
  const [imageUrls, setImageUrls] = useState<{ imageUrl: string; metadata: any }[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resYapayzeka, setResYapayzeka] = useState<YapayZekaResponse | null>(null);
  const [heatmapUrl, setHeatmapUrl] = useState<string | undefined>();
  const [requestDuration, setRequestDuration] = useState<number | null>(null);

  const navigate = useNavigate();
  const imagesListRef = ref(storage, "images/");

  const uploadFile = () => {
    if (!imageUpload) return;
    setUploadProgress(0);
    setLoading(true);

    // 2 saniyelik fake progress
    let fakeProgress = 0;
    const fakeInterval = setInterval(() => {
      fakeProgress += 5;
      setUploadProgress(fakeProgress);

      if (fakeProgress >= 100) {
        clearInterval(fakeInterval);
        const imageRef = ref(storage, `images/${imageUpload.name + v4()}`);
        const uploadTask = uploadBytesResumable(imageRef, imageUpload);

        uploadTask.on(
          "state_changed",
          () => { },
          (error) => {
            console.error(error);
            setUploadProgress(0);
            setLoading(false);
          },
          async () => {
            setUploadProgress(100);
            const metadata = await getMetadata(imageRef);
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setImageUrls(prev => [...prev, { imageUrl: url, metadata }]);
          }
        );
      }
    }, 100);
  };

  const getData = async () => {
    try {
      const response = await listAll(imagesListRef);
      const items = await Promise.all(
        response.items.map(async (item) => ({
          imageUrl: await getDownloadURL(item),
          metadata: await getMetadata(item)
        }))
      );
      setImageUrls(items);
    } catch (error) {
      console.error(error);
    }
  };


  useEffect(() => { if (uploadProgress === 100) getData(); }, [uploadProgress]);
  useEffect(() => { getData(); }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setLoading(false);
    setResYapayzeka(null);
    setHeatmapUrl(undefined);
    setRequestDuration(null);
  };

  const handleTestEt = async (imageUrl: string) => {
    setRequestDuration(0);
    setIsModalOpen(true);
    setLoading(true);

    try {
      const res = await axios.post(`${apiUrl}/yapayzeka`, { imageUrl });
      setResYapayzeka(res.data);

      const score = Array.isArray(res.data?.prediction) ? res.data.prediction[0] : res.data?.prediction;
      if (typeof score === "number" && score > 0.5) {
        const start = Date.now();
        const resHeatmap = await axios.post(
          `${apiUrl}/generate-heatmap`,
          { imageUrl },
          { responseType: "blob" }
        );
        setHeatmapUrl(URL.createObjectURL(resHeatmap.data));
        setRequestDuration((Date.now() - start) / 1000);
      }
    } catch (err) { console.log(err); }

    setLoading(false);
  };

  const handleDelete = async (imgPath: string) => {
    try {
      const res = await axios.get(`${apiUrl}/deneme`);
      console.log(res.data)

      await deleteObject(ref(storage, imgPath));
      setImageUrls(prev => prev.filter(img => img.metadata.fullPath !== imgPath));
      toast.success("Fotoğraf başarıyla silindi!");
    } catch (error) { console.error(error); }
  };

  const handleNavigate = () => navigate("/grafik");

  return (
    <div className="min-h-screen bg-white px-20">
      {/* Üst alan */}
      <div className="flex items-center justify-between h-16 mt-4 gap-4">
        <div className="flex items-center gap-4">
          <label htmlFor="file-upload" className="cursor-pointer rounded border border-blue-600 bg-white px-6 py-3 text-blue-600 hover:bg-blue-600 hover:text-white">
            📂 Fotoğraf Seç
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={(e) => {
              if (!e.target.files?.[0]) return;
              const file = e.target.files[0];
              if (!["image/jpg", "image/jpeg", "image/png"].includes(file.type)) {
                toast.error("Sadece JPG, JPEG veya PNG yüklenebilir.", { position: "top-right", autoClose: 3000 });
                return;
              }
              setImageUpload(file);
            }}
          />
          {imageUpload && <p className="text-gray-700">Seçilen dosya: <span className="font-medium">{imageUpload.name}</span></p>}

          <button
            className="relative rounded border flex justify-center border-blue-600 bg-blue-600 px-6 py-3 text-white transition duration-500 hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={uploadProgress > 0 && uploadProgress < 100}
            onClick={uploadFile}
          >
            <span className={uploadProgress > 0 && uploadProgress < 100 ? "opacity-0" : "opacity-100"}>Fotoğraf Yükle</span>
            {uploadProgress > 0 && uploadProgress < 100 && <span className="absolute"><ClipLoader size={28} color="white" /></span>}
          </button>
        </div>

        <button
          onClick={handleNavigate}
          className="rounded border border-blue-600 bg-blue-600 px-6 py-3 text-white transition duration-500 hover:bg-white hover:text-blue-600"
        >
          Performans Çıktıları
        </button>
      </div>

      <div className="mt-5">
        <h2 className="text-3xl text-blue-600 font-semibold">Yüklenen Fotoğraflar</h2>
        <div className="mt-2">
          {imageUrls.length === 0 ? (
            <div className="flex items-center justify-center h-[60vh]">
              <ClipLoader size={60} color="#2563EB" /> {/* Ortada spinner */}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {imageUrls.sort((a, b) => new Date(b.metadata.timeCreated).getTime() - new Date(a.metadata.timeCreated).getTime()).map((img, idx) => (
                <div key={idx} className="rounded-lg bg-white py-6 px-2 shadow">
                  <img className="w-full h-full object-cover rounded" src={img.imageUrl} alt={`uploaded ${idx}`} />
                  <div className="mt-3 flex flex-col items-center gap-2">
                    <p><b>Fotoğraf Boyutu:</b> {(img.metadata.size / 1_000_000).toFixed(2)} MB</p>
                    <p><b>Yüklenme Tarihi:</b> {moment(img.metadata.timeCreated).format("LLL")}</p>
                    <div className="mt-2 text-lg flex items-center gap-2">
                      <button onClick={() => handleTestEt(img.imageUrl)} className="rounded border border-blue-600 bg-blue-600 w-24 px-3 py-2 text-white transition hover:bg-white hover:text-blue-600">Test Et</button>
                      <button onClick={() => handleDelete(img.metadata.fullPath)} className="rounded border border-red-600 bg-red-600 w-24 px-3 py-2 text-white transition hover:bg-white hover:text-red-600">Sil</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="max-h-[90vh] w-4/5 max-w-[800px] overflow-hidden rounded-lg bg-white shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-center border-b px-4 py-3"><h4 className="text-center text-xl font-medium">Model Test Sonucu</h4></div>
            <div className="flex flex-col items-center justify-center gap-4 p-6">
              {loading ? (
                <div className="flex flex-col items-center gap-4"><p className="text-2xl font-medium">Hatalı ürün testi yapılıyor</p><ClipLoader color="black" /></div>
              ) : (
                resYapayzeka && (
                  <div className="flex flex-col items-center gap-3">
                    {resYapayzeka.prediction?.[0] < 0.5 ? (
                      <div className="flex flex-col items-center gap-2"><span className="text-[28px] font-medium">BAŞARILI ÜRÜN</span><FaCircleCheck size={48} color="green" /></div>
                    ) : (
                      <div className="flex flex-col items-center gap-2"><span className="text-[28px] font-medium">HATALI ÜRÜN</span><IoMdCloseCircle size={48} color="red" /></div>
                    )}
                    {resYapayzeka.prediction?.[0] > 0.5 && <img className="h-[240px] w-[240px] object-contain" src={heatmapUrl ?? heatmap} alt="heatmap" />}
                    <p className="text-2xl">Tahminleme süresi: <b className="text-red-600">{resYapayzeka.predictionTime ? (resYapayzeka.predictionTime / 1000).toFixed(2) : "-"}</b> saniye</p>
                    <p className="text-2xl">Yüklenme süresi: <b className="text-red-600">{resYapayzeka.loadTime ? (resYapayzeka.loadTime / 1000).toFixed(2) : "-"}</b> saniye</p>
                    {requestDuration && <p className="text-2xl">Heatmap süresi: <b className="text-red-600">{requestDuration.toFixed(2)}</b> saniye</p>}
                  </div>
                )
              )}
            </div>
            <div className="flex justify-end gap-3 border-t px-4 py-3"><button onClick={closeModal} className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-700 transition hover:bg-gray-100">Kapat</button></div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default HomePage;

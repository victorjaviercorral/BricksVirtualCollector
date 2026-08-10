"use client";

import { UploadCloud, ShieldAlert, ImagePlus, Hash, Tag, Package, Info, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MesaTrabajoClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vitrinaId = searchParams.get("vitrina_id");
  const bountyId = searchParams.get("bounty_id");

  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [numSet, setNumSet] = useState("");
  const [numPiezas, setNumPiezas] = useState("");
  const [tematica, setTematica] = useState("Star Wars");
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState("Nuevo en Caja (MISB)");
  const [notas, setNotas] = useState("");

  const [vitrinas, setVitrinas] = useState<any[]>([]);
  const [selectedVitrinaId, setSelectedVitrinaId] = useState<string>(vitrinaId || "");
  const [isLoadingVitrinas, setIsLoadingVitrinas] = useState(!vitrinaId);

  // Fetch vitrinas if no vitrinaId is provided in URL
  useEffect(() => {
    if (vitrinaId) {
      setSelectedVitrinaId(vitrinaId);
      setIsLoadingVitrinas(false);
      return;
    }
    
    const fetchVitrinas = async () => {
      setIsLoadingVitrinas(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('vitrinas').select('id, nombre').eq('usuario_id', user.id);
        if (data) {
          setVitrinas(data);
          if (data.length > 0) setSelectedVitrinaId(data[0].id);
        }
      }
      setIsLoadingVitrinas(false);
    };
    fetchVitrinas();
  }, [vitrinaId]);

  const processImageToStripExif = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("No 2d context"));
        }
        ctx.drawImage(img, 0, 0);
        
        // Convert to WebP or JPEG without EXIF
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas to Blob failed"));
        }, "image/jpeg", 0.9);
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("La imagen no debe superar los 10MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    /* istanbul ignore next */
    if (!selectedVitrinaId) {
      setErrorMsg("Debes seleccionar una vitrina para asociar este set.");
      return;
    }
    if (!nombre) {
      setErrorMsg("El nombre del set es obligatorio.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error("No autenticado");

      // 1. Upload photo if exists
      let uploadedImageUrl = null;
      if (imageFile) {
        const cleanedBlob = await processImageToStripExif(imageFile);
        const fileName = `${userData.user.id}/${Date.now()}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("fotos_sets")
          .upload(fileName, cleanedBlob, {
            contentType: "image/jpeg",
            upsert: false
          });
          
        if (uploadError) throw new Error("Error al subir la foto: " + uploadError.message);
        
        const { data: publicUrlData } = supabase.storage
          .from("fotos_sets")
          .getPublicUrl(fileName);
          
        uploadedImageUrl = publicUrlData.publicUrl;
      }

      // 2. Insert into sets
      const { data: setData, error: setError } = await supabase
        .from("sets")
        .insert({
          vitrina_id: selectedVitrinaId,
          usuario_id: userData.user.id,
          nombre: nombre,
          num_set: numSet,
          tematica: tematica,
          estado: estado,
          notas: notas,
          num_piezas: numPiezas ? parseInt(numPiezas, 10) : 0
        })
        .select()
        .single();

      if (setError) throw new Error("Error al crear el set: " + setError.message);

      // 3. Insert into fotos table if image was uploaded
      if (uploadedImageUrl && setData) {
        const { error: fotoError } = await supabase
          .from("fotos")
          .insert({
            set_id: setData.id,
            url: uploadedImageUrl,
            orden: 0
          });
          
        if (fotoError) console.error("Error inserting foto record:", fotoError);
      }

      // 4. Claim bounty if applicable
      if (bountyId && setData) {
        try {
          const res = await fetch("/api/bounties/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bountyId, setId: setData.id })
          });
          if (!res.ok) {
            console.error("Failed to claim bounty:", await res.text());
          }
        } catch (e) {
          console.error("Error claiming bounty:", e);
        }
      }

      router.push(`/dashboard/vitrina/${selectedVitrinaId}`);
      
    } catch (err: any) {
      setErrorMsg(err.message || "Ha ocurrido un error inesperado.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10 pb-20 mt-10">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Añadir Set</h1>
          <p className="text-black/60 dark:text-white/60">Añade un nuevo set a tu vitrina.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-green/10 text-brand-green font-medium rounded-full text-sm">
          <ShieldAlert size={16} /> Metadatos (EXIF) se eliminarán
        </div>
      </header>

      {errorMsg && (
        <div className="p-4 bg-red-100 text-red-700 rounded-xl font-medium">
          {errorMsg}
        </div>
      )}

      {!selectedVitrinaId && !isLoadingVitrinas && vitrinas.length === 0 && (
        <div className="p-4 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 rounded-xl font-medium flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
          <span>Para añadir un set, primero debes crear al menos una vitrina.</span>
          <Link href="/dashboard" className="px-5 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors whitespace-nowrap font-bold">
            Ir al Dashboard
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Photos */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            className="hidden" 
          />
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[4/5] w-full rounded-3xl border-2 border-dashed border-brand-blue/30 bg-brand-blue/5 hover:bg-brand-blue/10 transition-colors flex flex-col items-center justify-center gap-4 cursor-pointer group overflow-hidden relative"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-white dark:bg-black shadow-sm flex items-center justify-center text-brand-blue group-hover:scale-110 transition-transform">
                  <UploadCloud size={32} />
                </div>
                <div className="text-center px-6">
                  <p className="font-bold text-brand-blue">Sube la foto principal</p>
                  <p className="text-xs text-black/50 mt-1">Arrastra tu imagen aquí. JPG o PNG hasta 10MB.</p>
                </div>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square rounded-2xl border border-dashed border-black/20 dark:border-white/20 flex items-center justify-center text-black/30 hover:bg-black/5 cursor-pointer transition-colors">
                <ImagePlus size={24} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass p-6 sm:p-8 rounded-3xl flex flex-col gap-6 shadow-sm">
            
            {!vitrinaId && (
              <div className="flex flex-col gap-2 p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl mb-2">
                <label htmlFor="mesa-vitrina-destino" className="text-xs font-bold uppercase tracking-wider text-brand-blue ml-1 flex items-center gap-1">
                  <Package size={14} /> Seleccionar Vitrina de destino
                </label>
                {isLoadingVitrinas ? (
                  <div className="flex items-center gap-2 text-black/50 text-sm p-2">
                    <Loader2 size={16} className="animate-spin" /> Cargando tus vitrinas...
                  </div>
                ) : (
                  <select
                    id="mesa-vitrina-destino"
                    value={selectedVitrinaId}
                    onChange={(e) => setSelectedVitrinaId(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-black rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50 appearance-none font-bold shadow-sm"
                  >
                    <option value="" disabled>Elige una vitrina...</option>
                    {vitrinas.map(v => (
                      <option key={v.id} value={v.id}>{v.nombre}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="mesa-num-set" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Número de Set</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                  <input
                    id="mesa-num-set"
                    type="text"
                    value={numSet}
                    onChange={(e) => setNumSet(e.target.value)}
                    placeholder="Ej. 75192" 
                    className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="mesa-num-piezas" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Número de Piezas</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                  <input
                    id="mesa-num-piezas"
                    type="number"
                    value={numPiezas}
                    onChange={(e) => setNumPiezas(e.target.value)}
                    placeholder="Ej. 7541" 
                    className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50" 
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="mesa-tematica" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Temática</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                <select
                  id="mesa-tematica"
                  value={tematica}
                  onChange={(e) => setTematica(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50 appearance-none"
                >
                  <option>Star Wars</option>
                  <option>Icons</option>
                  <option>Architecture</option>
                  <option>Ideas</option>
                  <option>Technic</option>
                  <option>City</option>
                  <option>Creator</option>
                  <option>Harry Potter</option>
                  <option>Otro</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="mesa-nombre-set" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Nombre del Set</label>
              <input
                id="mesa-nombre-set"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Halcón Milenario UCS" 
                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50" 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="mesa-estado" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Estado de conservación</label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                <select
                  id="mesa-estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50 appearance-none"
                >
                  <option>Nuevo en Caja (MISB)</option>
                  <option>Montado</option>
                  <option>Desmontado en bolsas</option>
                  <option>Incompleto</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="mesa-notas" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1 flex items-center justify-between">
                Notas
                <span className="text-brand-blue text-[10px] bg-brand-blue/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Info size={12}/> Opcional</span>
              </label>
              <textarea
                id="mesa-notas"
                rows={4}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Añade historia sobre tu set, dónde lo conseguiste, qué le falta..." 
                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50 resize-none"
              ></textarea>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 mt-2">
            <Link href={selectedVitrinaId ? `/dashboard/vitrina/${selectedVitrinaId}` : "/dashboard"} className="px-6 py-3 font-medium text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white">
              Cancelar
            </Link>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedVitrinaId}
              title={!selectedVitrinaId ? "Falta seleccionar una vitrina" : ""}
              className="px-8 py-3 rounded-full bg-brand-blue text-white font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Añadir Set
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

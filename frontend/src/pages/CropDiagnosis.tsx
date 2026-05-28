import { useState, useRef, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import {
  Camera, Upload, X, Loader2, Leaf, AlertTriangle,
  Microscope, Sprout, FlaskConical, CheckCircle2, RefreshCw, ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface DiagnosisResult {
  cropName: string;
  healthStatus: 'Healthy' | 'Diseased' | 'Stressed' | 'Unknown';
  confidence: string;
  disease: string;
  symptoms: string[];
  causes: string[];
  treatment: {
    sprays: { name: string; dosage: string; frequency: string }[];
    organic: string[];
    cultural: string[];
  };
  prevention: string[];
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  additionalNotes: string;
}

const urgencyColors: Record<string, string> = {
  Low: 'bg-green-100 text-green-800 border-green-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  High: 'bg-orange-100 text-orange-800 border-orange-200',
  Critical: 'bg-red-100 text-red-800 border-red-200',
};

const healthColors: Record<string, string> = {
  Healthy: 'text-green-600',
  Diseased: 'text-red-600',
  Stressed: 'text-orange-600',
  Unknown: 'text-gray-500',
};

const CropDiagnosis = () => {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file (JPG, PNG, WEBP)', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image under 10MB', variant: 'destructive' });
      return;
    }
    setImageFile(file);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const analyzeImage = async () => {
    if (!imageFile || !token) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const res = await fetch(`${API_BASE}/ai/crop-diagnosis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageBase64: base64, mimeType: imageFile.type }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Analysis failed');
      setResult(data.diagnosis);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze image. Please try again.');
      toast({ title: 'Analysis Failed', description: err.message, variant: 'destructive' });
    }
    setIsAnalyzing(false);
  };

  return (
    <Layout>
      <div className="bg-secondary min-h-screen">
        <div className="bg-gradient-hero text-primary-foreground py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Microscope className="h-7 w-7" /> Crop Disease Diagnosis
            </h1>
            <p className="text-primary-foreground/80 text-sm mt-1">
              Upload a photo of your crop — AI will identify diseases and recommend treatment
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-8">

            {/* Left — Upload Panel */}
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" /> Upload Crop Photo
                </h2>

                {!imagePreview ? (
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                      isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-secondary'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-full bg-primary/10 text-primary">
                        <Upload className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Drag & drop or click to upload</p>
                        <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WEBP — max 10MB</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <img src={imagePreview} alt="Crop preview" className="w-full rounded-xl object-cover max-h-72" />
                    <button onClick={clearImage}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                    {imageFile && (
                      <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} className="hidden" />

                <div className="flex gap-3 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" /> Gallery
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => cameraInputRef.current?.click()}>
                    <Camera className="h-4 w-4 mr-2" /> Camera
                  </Button>
                </div>

                <Button onClick={analyzeImage} disabled={!imageFile || isAnalyzing} className="w-full mt-4" size="lg">
                  {isAnalyzing
                    ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Analyzing crop...</>
                    : <><Microscope className="h-5 w-5 mr-2" /> Diagnose Crop</>
                  }
                </Button>
              </div>

              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                  <Leaf className="h-4 w-4 text-primary" /> Tips for best results
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    'Take a clear, close-up photo of affected leaves or stems',
                    'Ensure good lighting — natural daylight works best',
                    'Capture both affected and healthy parts for comparison',
                    'Avoid blurry or dark images',
                    'Show any spots, discoloration, or unusual growth',
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 flex-shrink-0">•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right — Results Panel */}
            <div>
              {isAnalyzing && (
                <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Analyzing your crop...</p>
                      <p className="text-sm text-muted-foreground">AI is examining the image</p>
                    </div>
                  </div>
                  {[70, 50, 90, 60].map((w, i) => (
                    <div key={i} className="h-4 bg-secondary rounded animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              )}

              {error && !isAnalyzing && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800">Analysis Failed</p>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                      <Button onClick={analyzeImage} variant="outline" size="sm" className="mt-3 border-red-300 text-red-700 hover:bg-red-50">
                        <RefreshCw className="h-4 w-4 mr-1" /> Try Again
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!isAnalyzing && !result && !error && (
                <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center">
                  <Sprout className="h-14 w-14 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="font-medium text-foreground">No diagnosis yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Upload a crop photo and click "Diagnose Crop" to get AI analysis</p>
                </div>
              )}

              {result && !isAnalyzing && (
                <div className="space-y-4">
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{result.cropName}</h3>
                        <p className={`font-semibold mt-1 ${healthColors[result.healthStatus] || 'text-gray-600'}`}>
                          {result.healthStatus}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${urgencyColors[result.urgency] || 'bg-gray-100 text-gray-700'}`}>
                          {result.urgency} Urgency
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">Confidence: {result.confidence}</p>
                      </div>
                    </div>
                    {result.disease && result.disease !== 'None' && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" /> Disease Detected: {result.disease}
                        </p>
                      </div>
                    )}
                  </div>

                  {(result.symptoms?.length > 0 || result.causes?.length > 0) && (
                    <div className="bg-card rounded-2xl border border-border p-5 grid grid-cols-2 gap-4">
                      {result.symptoms?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Symptoms</p>
                          <ul className="space-y-1">
                            {result.symptoms.map((s, i) => (
                              <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                                <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.causes?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Causes</p>
                          <ul className="space-y-1">
                            {result.causes.map((c, i) => (
                              <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                                <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {result.treatment?.sprays?.length > 0 && (
                    <div className="bg-card rounded-2xl border border-border p-5">
                      <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-primary" /> Recommended Sprays / Pesticides
                      </p>
                      <div className="space-y-3">
                        {result.treatment.sprays.map((spray, i) => (
                          <div key={i} className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                            <p className="font-semibold text-foreground text-sm">{spray.name}</p>
                            <div className="flex gap-4 mt-1">
                              <p className="text-xs text-muted-foreground">Dose: <span className="text-foreground font-medium">{spray.dosage}</span></p>
                              <p className="text-xs text-muted-foreground">When: <span className="text-foreground font-medium">{spray.frequency}</span></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(result.treatment?.organic?.length > 0 || result.treatment?.cultural?.length > 0) && (
                    <div className="bg-card rounded-2xl border border-border p-5 grid grid-cols-2 gap-4">
                      {result.treatment.organic?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Organic Remedies</p>
                          <ul className="space-y-1">
                            {result.treatment.organic.map((o, i) => (
                              <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                                <Leaf className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" /> {o}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.treatment.cultural?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Cultural Practices</p>
                          <ul className="space-y-1">
                            {result.treatment.cultural.map((c, i) => (
                              <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" /> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {result.prevention?.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                      <p className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                        <Sprout className="h-4 w-4" /> Prevention Tips
                      </p>
                      <ul className="space-y-1.5">
                        {result.prevention.map((p, i) => (
                          <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                            <span className="mt-0.5 flex-shrink-0">✓</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.additionalNotes && (
                    <div className="bg-card border border-border rounded-2xl p-4 text-sm text-muted-foreground">
                      <strong className="text-foreground">Note: </strong>{result.additionalNotes}
                    </div>
                  )}

                  <Button onClick={clearImage} variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" /> Analyze Another Crop
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CropDiagnosis;
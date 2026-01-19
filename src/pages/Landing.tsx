import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Building2, FileSpreadsheet, Zap, Layers } from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 flex items-center justify-center">
              <img src="/Logo_BMKG.png" alt="BMKG Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              SKPG Tools DIY
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Sistem Identifikasi Anomali Iklim sebagai Salah Satu Faktor Penentu dalam SKPG
            </p>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              BMKG Stasiun Klimatologi D.I. Yogyakarta
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 justify-center pt-8">
            {/* Primary: Combined Input */}
            <Button
              size="lg"
              onClick={() => navigate('/combined')}
              className="text-lg px-10 py-7 h-auto"
            >
              <Layers className="w-6 h-6 mr-3" />
              Isi Data Lengkap (Kab + Kec)
            </Button>
            <p className="text-sm text-muted-foreground text-center -mt-2">
              Rekomen: Input sekali, export 2 file Excel
            </p>
            
            {/* Secondary Options */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-2">
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/kabupaten')}
                className="text-base px-6 py-5 h-auto"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Kabupaten Saja
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/kecamatan')}
                className="text-base px-6 py-5 h-auto"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Kecamatan Saja
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Input Data Bertahap</CardTitle>
              <CardDescription>
                Proses input data yang terstruktur dengan panduan step-by-step untuk setiap indikator anomali iklim
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Visualisasi Peta</CardTitle>
              <CardDescription>
                Tampilan peta interaktif untuk memvisualisasikan data grid point dan hasil analisis per wilayah
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Export Excel</CardTitle>
              <CardDescription>
                Hasil analisis otomatis diekspor ke format Excel sesuai template SKPG dengan perhitungan skor dan kategori
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container max-w-6xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground border-t">
        <p>© 2026 BMKG Stasiun Klimatologi D.I. Yogyakarta</p>
      </footer>
    </div>
  );
};

export default Landing;


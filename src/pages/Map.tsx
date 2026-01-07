import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEquipment } from '@/hooks/useEquipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const { equipment, loading } = useEquipment();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current).setView([-15.7801, -47.9292], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || loading) return;

    map.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.current?.removeLayer(layer);
    });

    const equipmentWithCoords = equipment.filter(e => e.latitude && e.longitude);
    
    equipmentWithCoords.forEach((eq) => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: ${eq.status === 'active' ? '#22c55e' : eq.status === 'maintenance' ? '#f59e0b' : '#ef4444'}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([Number(eq.latitude), Number(eq.longitude)], { icon })
        .addTo(map.current!)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${eq.serial_number}</h3>
            <p style="margin: 2px 0;"><strong>Tipo:</strong> ${eq.type || '-'}</p>
            <p style="margin: 2px 0;"><strong>Marca:</strong> ${eq.brand || '-'}</p>
            <p style="margin: 2px 0;"><strong>Local:</strong> ${eq.address || '-'}</p>
            <p style="margin: 2px 0;"><strong>Status:</strong> ${eq.status}</p>
          </div>
        `);
    });

    if (equipmentWithCoords.length > 0) {
      const bounds = L.latLngBounds(equipmentWithCoords.map(e => [Number(e.latitude), Number(e.longitude)]));
      map.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [equipment, loading]);

  return (
    <AppLayout title="Mapa">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mapa de Equipamentos</h1>
            <p className="text-muted-foreground">Visualização geográfica dos equipamentos</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Ativo</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Manutenção</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Inativo</div>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="h-[600px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div ref={mapContainer} className="h-[600px] rounded-lg" />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

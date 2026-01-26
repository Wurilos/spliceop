import { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEquipment } from '@/hooks/useEquipment';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Fix Leaflet default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Paleta de cores para contratos
const CONTRACT_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#eab308', // yellow
  '#10b981', // emerald
  '#64748b', // slate
];

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const { equipment, loading } = useEquipment();

  // Mapeia cada contrato para uma cor
  const contractColorMap = useMemo(() => {
    const uniqueContracts = [...new Set(equipment
      .filter(e => e.contract_id)
      .map(e => e.contract_id)
    )];
    
    const colorMap: Record<string, { color: string; name: string }> = {};
    
    uniqueContracts.forEach((contractId, index) => {
      const eq = equipment.find(e => e.contract_id === contractId);
      const contractName = (eq as any)?.contracts?.client_name || 'Sem Nome';
      colorMap[contractId!] = {
        color: CONTRACT_COLORS[index % CONTRACT_COLORS.length],
        name: contractName
      };
    });
    
    return colorMap;
  }, [equipment]);

  // Lista de contratos para a legenda
  const legendItems = useMemo(() => {
    return Object.entries(contractColorMap).map(([id, { color, name }]) => ({
      id,
      color,
      name,
      count: equipment.filter(e => e.contract_id === id && e.latitude && e.longitude).length
    })).filter(item => item.count > 0).sort((a, b) => a.name.localeCompare(b.name));
  }, [contractColorMap, equipment]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Ensure container has dimensions before initializing
    const container = mapContainer.current;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      // Retry after a short delay
      const timer = setTimeout(() => {
        if (container.offsetWidth > 0 && container.offsetHeight > 0 && !map.current) {
          map.current = L.map(container).setView([-15.7801, -47.9292], 4);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map.current);
          setMapReady(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    map.current = L.map(container).setView([-15.7801, -47.9292], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current);

    setMapReady(true);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapReady(false);
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || loading) return;

    map.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.current?.removeLayer(layer);
    });

    const equipmentWithCoords = equipment.filter(e => e.latitude && e.longitude);
    
    equipmentWithCoords.forEach((eq) => {
      const contractInfo = eq.contract_id ? contractColorMap[eq.contract_id] : null;
      const markerColor = contractInfo?.color || '#6b7280'; // gray for no contract
      const contractName = contractInfo?.name || 'Sem Contrato';

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: ${markerColor}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([Number(eq.latitude), Number(eq.longitude)], { icon })
        .addTo(map.current!)
        .bindPopup(`
          <div style="min-width: 220px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${eq.serial_number}</h3>
            <p style="margin: 2px 0;"><strong>Contrato:</strong> ${contractName}</p>
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
  }, [equipment, loading, contractColorMap]);

  const equipmentWithCoords = equipment.filter(e => e.latitude && e.longitude);
  const noContractCount = equipmentWithCoords.filter(e => !e.contract_id).length;

  return (
    <AppLayout title="Mapa">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mapa de Equipamentos</h1>
            <p className="text-muted-foreground">
              Visualização geográfica dos equipamentos ({equipmentWithCoords.length} com coordenadas)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Mapa */}
          <Card className="lg:col-span-3">
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

          {/* Legenda */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Legenda por Contrato</h3>
              <ScrollArea className="h-[540px]">
                <div className="space-y-2 pr-2">
                  {legendItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow-sm" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm truncate flex-1" title={item.name}>
                        {item.name}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {item.count}
                      </span>
                    </div>
                  ))}
                  {noContractCount > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow-sm" 
                        style={{ backgroundColor: '#6b7280' }}
                      />
                      <span className="text-sm truncate flex-1 text-muted-foreground">
                        Sem Contrato
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {noContractCount}
                      </span>
                    </div>
                  )}
                  {legendItems.length === 0 && noContractCount === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum equipamento com coordenadas
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

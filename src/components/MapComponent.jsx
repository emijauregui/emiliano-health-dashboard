import { MapContainer, TileLayer, Polyline } from 'react-leaflet'

export default function MapComponent({ route }) {
  return (
    <MapContainer center={route[0]} zoom={13} className="h-full w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Polyline positions={route} color="blue" />
    </MapContainer>
  )
}
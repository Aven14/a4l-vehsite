'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Vehicle {
  id: string
  name: string
  price: number
  power: number | null
  vmax: number | null
  trunk: number | null
  seats: number | null
  images: string
  brand: { id: string; name: string }
}
interface VehicleCardData extends Vehicle {
  imageList: string[]
}

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'power-desc' | 'power-asc' | 'vmax-desc' | 'vmax-asc' | 'trunk-desc' | 'trunk-asc' | 'seats-desc' | 'seats-asc'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')

  useEffect(() => {
    fetch('/api/vehicles')
      .then(res => res.json())
      .then(data => {
        setVehicles(data)
        setLoading(false)
      })
  }, [])

  const normalizedVehicles = useMemo<VehicleCardData[]>(() => {
    return vehicles.map((vehicle) => {
      try {
        const parsed = JSON.parse(vehicle.images || '[]')
        return { ...vehicle, imageList: Array.isArray(parsed) ? parsed : [] }
      } catch {
        return { ...vehicle, imageList: [] }
      }
    })
  }, [vehicles])

  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = normalizedVehicles
    
    // Filtrer par recherche
    if (search.trim()) {
      const s = search.toLowerCase()
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(s) ||
        v.brand.name.toLowerCase().includes(s)
      )
    }

    // Trier
    const sorted = [...filtered]
    switch (sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'power-desc':
        sorted.sort((a, b) => (b.power || 0) - (a.power || 0))
        break
      case 'power-asc':
        sorted.sort((a, b) => (a.power || 0) - (b.power || 0))
        break
      case 'vmax-desc':
        sorted.sort((a, b) => (b.vmax || 0) - (a.vmax || 0))
        break
      case 'vmax-asc':
        sorted.sort((a, b) => (a.vmax || 0) - (b.vmax || 0))
        break
      case 'trunk-desc':
        sorted.sort((a, b) => (b.trunk || 0) - (a.trunk || 0))
        break
      case 'trunk-asc':
        sorted.sort((a, b) => (a.trunk || 0) - (b.trunk || 0))
        break
      case 'seats-desc':
        sorted.sort((a, b) => (b.seats || 0) - (a.seats || 0))
        break
      case 'seats-asc':
        sorted.sort((a, b) => (a.seats || 0) - (b.seats || 0))
        break
    }
    
    return sorted
  }, [normalizedVehicles, search, sortBy])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-2">
          Tous les <span className="text-primary-400">Véhicules</span>
        </h1>
        <p className="text-gray-500 mb-6">Liste non-officielle des véhicules disponibles</p>

        {/* Barre de recherche et tri */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Rechercher un véhicule ou une marque..."
            className="flex-1 bg-dark-100 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-dark-100 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none min-w-max"
          >
            <optgroup label="Nom">
              <option value="name-asc">A → Z</option>
              <option value="name-desc">Z → A</option>
            </optgroup>
            <optgroup label="Prix">
              <option value="price-asc">Prix : bas → haut</option>
              <option value="price-desc">Prix : haut → bas</option>
            </optgroup>
            <optgroup label="Performance">
              <option value="power-desc">Puissance : haute → basse</option>
              <option value="power-asc">Puissance : basse → haute</option>
              <option value="vmax-desc">Vitesse : rapide → lent</option>
              <option value="vmax-asc">Vitesse : lent → rapide</option>
            </optgroup>
            <optgroup label="Capacité">
              <option value="trunk-desc">Coffre : grand → petit</option>
              <option value="trunk-asc">Coffre : petit → grand</option>
              <option value="seats-desc">Places : plus → moins</option>
              <option value="seats-asc">Places : moins → plus</option>
            </optgroup>
          </select>
        </div>

        <p className="text-gray-500 text-sm mb-6">{filteredAndSortedVehicles.length} véhicule(s)</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedVehicles.map((vehicle, index) => {
            return (
              <Link 
                href={`/vehicles/${vehicle.id}`} 
                key={vehicle.id} 
                className="card card-3d-hover overflow-hidden group animate-card-skew"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="aspect-video bg-dark-300 relative overflow-hidden">
                  {vehicle.imageList[0] ? (
                    <Image src={vehicle.imageList[0]} alt={vehicle.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <span className="text-4xl">🚗</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-primary-400 text-sm mb-1">{vehicle.brand.name}</p>
                  <h2 className="font-display text-lg font-bold text-white mb-2">{vehicle.name}</h2>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary-400">{vehicle.price.toLocaleString()} €</span>
                    {vehicle.power && <span className="text-gray-500 text-sm">{vehicle.power} CV</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {filteredAndSortedVehicles.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {search ? 'Aucun véhicule trouvé pour cette recherche' : 'Aucun véhicule disponible'}
          </div>
        )}
      </div>
    </div>
  )
}

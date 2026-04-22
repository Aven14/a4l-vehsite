import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { makeUniqueId, toSlug } from '@/lib/slug'
import { requirePermission } from '@/lib/api-auth'
import { z } from 'zod'

// Force dynamic pour éviter les problèmes au build
export const dynamic = 'force-dynamic'

// GET - Liste tous les véhicules
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const brandId = searchParams.get('brandId')

    let sql = `SELECT v.*, b.name as brand_name, b.logo as brand_logo 
               FROM "Vehicle" v 
               LEFT JOIN "Brand" b ON v."brandId" = b.id`
    const params = []
    
    if (brandId) {
      sql += ` WHERE v."brandId" = $1`
      params.push(brandId)
    }
    
    sql += ` ORDER BY v.name ASC`
    
    const result = await query(sql, params)
    
    const vehicles = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      power: row.power,
      trunk: row.trunk,
      vmax: row.vmax,
      seats: row.seats,
      images: row.images,
      brandId: row.brandId,
      category: row.category,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      brand: {
        id: row.brandId,
        name: row.brand_name,
        logo: row.brand_logo
      }
    }))

    const response = NextResponse.json(vehicles)
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600')
    return response
  } catch (error) {
    console.error('Erreur GET /api/vehicles:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un véhicule (admin)
export async function POST(req: NextRequest) {
  const auth = await requirePermission('canEditVehicles')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await req.json()
  const schema = z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().max(5000).nullable().optional(),
    price: z.coerce.number().int().nonnegative(),
    images: z.array(z.string().url()).max(20).optional(),
    brandId: z.string().trim().min(1),
    category: z.string().trim().max(120).nullable().optional(),
    power: z.coerce.number().int().nonnegative().nullable().optional(),
    trunk: z.coerce.number().int().nonnegative().nullable().optional(),
    vmax: z.coerce.number().int().nonnegative().nullable().optional(),
    seats: z.coerce.number().int().nonnegative().nullable().optional(),
  })
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }
  const { name, description, price, images, brandId, category, power, trunk, vmax, seats } = parsed.data

  const brand = await prisma.brand.findUnique({ where: { id: brandId } })
  if (!brand) {
    return NextResponse.json({ error: 'Marque introuvable' }, { status: 404 })
  }

  const idBase = `${brand.name}-${name}`
  const id = await makeUniqueId(
    idBase,
    async (candidate) => {
      const existing = await prisma.vehicle.findUnique({ where: { id: candidate } })
      return !!existing
    },
    `vehicle-${toSlug(brand.name) || 'brand'}`
  )

  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        id,
        name,
        description: description ?? null,
        price,
        power: power ?? null,
        trunk: trunk ?? null,
        vmax: vmax ?? null,
        seats: seats ?? null,
        images: JSON.stringify(images || []),
        brandId,
        category: category ?? null,
      },
    })
    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/vehicles:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

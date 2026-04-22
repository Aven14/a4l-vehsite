import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/api-auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// GET - Détail d'un véhicule
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await query(
      `SELECT v.id, v.name, v.description, v.price, v.power, v.trunk, v.vmax, v.seats, v.images,
              b.id as brand_id, b.name as brand_name, b.logo as brand_logo
       FROM "Vehicle" v
       LEFT JOIN "Brand" b ON v."brandId" = b.id
       WHERE v.id = $1`,
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Véhicule non trouvé' }, { status: 404 })
    }

    const row = result.rows[0]
    const vehicle = {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      power: row.power,
      trunk: row.trunk,
      vmax: row.vmax,
      seats: row.seats,
      images: row.images,
      brand: {
        id: row.brand_id,
        name: row.brand_name,
        logo: row.brand_logo
      }
    }

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error('Vehicle GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Modifier un véhicule (admin)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission('canEditVehicles')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await req.json()
  const schema = z.object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    price: z.coerce.number().int().nonnegative().optional(),
    images: z.array(z.string().url()).max(20).optional(),
    brandId: z.string().trim().min(1).optional(),
    category: z.string().trim().max(120).nullable().optional(),
    power: z.coerce.number().int().nonnegative().nullable().optional(),
    trunk: z.coerce.number().int().nonnegative().nullable().optional(),
    vmax: z.coerce.number().int().nonnegative().nullable().optional(),
    seats: z.coerce.number().int().nonnegative().nullable().optional(),
  }).refine((value) => Object.keys(value).length > 0, { message: 'Aucune donnée à modifier' })
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }
  const { name, description, price, images, brandId, category, power, trunk, vmax, seats } = parsed.data

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price,
        power,
        trunk,
        vmax,
        seats,
        images: images ? JSON.stringify(images) : undefined,
        brandId,
        category,
      },
    })
    return NextResponse.json(vehicle)
  } catch (error) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2025') {
      return NextResponse.json({ error: 'Véhicule non trouvé' }, { status: 404 })
    }
    console.error('Vehicle PUT error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un véhicule (admin)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission('canDeleteVehicles')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    await prisma.vehicle.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2025') {
      return NextResponse.json({ error: 'Véhicule non trouvé' }, { status: 404 })
    }
    console.error('Vehicle DELETE error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

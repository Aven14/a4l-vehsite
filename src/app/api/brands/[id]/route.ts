import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/api-auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// GET - Détail d'une marque
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: params.id },
      include: {
        vehicles: {
          orderBy: { name: 'asc' }
        }
      }
    })

    if (!brand) {
      return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 })
    }

    return NextResponse.json(brand)
  } catch (error) {
    console.error('Brand GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Modifier une marque (admin)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission('canEditBrands')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await req.json()
  const schema = z.object({
    name: z.string().trim().min(1).optional(),
    logo: z.string().url().nullable().optional(),
    dealershipName: z.string().trim().max(120).nullable().optional(),
    dealershipLocation: z.string().trim().max(120).nullable().optional(),
  }).refine((value) => Object.keys(value).length > 0, { message: 'Aucune donnée à modifier' })
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }
  const { name, logo, dealershipName, dealershipLocation } = parsed.data

  try {
    const brand = await prisma.brand.update({
      where: { id: params.id },
      data: { 
        name, 
        logo,
        dealershipName,
        dealershipLocation
      },
    })
    return NextResponse.json(brand)
  } catch (error) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2025') {
      return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 })
    }
    console.error('Brand PUT error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une marque (admin)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission('canDeleteBrands')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    await prisma.brand.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2025') {
      return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 })
    }
    console.error('Brand DELETE error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { makeUniqueId } from '@/lib/slug'
import { requirePermission } from '@/lib/api-auth'
import { z } from 'zod'

// Force dynamic pour éviter les problèmes au build
export const dynamic = 'force-dynamic'

// GET - Liste toutes les marques
export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { vehicles: true }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    const response = NextResponse.json(brands)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800')
    return response
  } catch (error) {
    console.error('Erreur GET /api/brands:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une marque (admin)
export async function POST(req: NextRequest) {
  const auth = await requirePermission('canEditBrands')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await req.json()
  const schema = z.object({
    name: z.string().trim().min(1),
    logo: z.string().url().nullable().optional(),
    dealershipName: z.string().trim().max(120).nullable().optional(),
    dealershipLocation: z.string().trim().max(120).nullable().optional(),
  })
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }
  const { name, logo, dealershipName, dealershipLocation } = parsed.data

  const id = await makeUniqueId(
    name,
    async (candidate) => {
      const existing = await prisma.brand.findUnique({ where: { id: candidate } })
      return !!existing
    },
    'brand'
  )

  const brand = await prisma.brand.create({
    data: { 
      id,
      name, 
      logo: logo ?? null,
      dealershipName: dealershipName || 'Concessionnaire',
      dealershipLocation: dealershipLocation || 'Inconnu'
    },
  })

  return NextResponse.json(brand, { status: 201 })
}

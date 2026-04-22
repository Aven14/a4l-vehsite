const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

function toSlug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

async function makeUniqueId(baseValue, exists, fallbackPrefix = 'item') {
  const base = toSlug(baseValue) || `${fallbackPrefix}-${Date.now()}`
  if (!(await exists(base))) {
    return base
  }

  let i = 2
  while (await exists(`${base}-${i}`)) {
    i++
  }

  return `${base}-${i}`
}

async function main() {
  // Créer les rôles système
  const superadminRole = await prisma.role.upsert({
    where: { name: 'superadmin' },
    update: {},
    create: {
      name: 'superadmin',
      canAccessAdmin: true,
      canEditBrands: true,
      canEditVehicles: true,
      canDeleteBrands: true,
      canDeleteVehicles: true,
      canImport: true,
      canManageUsers: true,
      canManageRoles: true,
      isSystem: true,
    },
  })

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      canAccessAdmin: true,
      canEditBrands: true,
      canEditVehicles: true,
      canDeleteBrands: true,
      canDeleteVehicles: true,
      canImport: true,
      canManageUsers: false,
      canManageRoles: false,
      isSystem: true,
    },
  })

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      canAccessAdmin: false,
      canEditBrands: false,
      canEditVehicles: false,
      canDeleteBrands: false,
      canDeleteVehicles: false,
      canImport: false,
      canManageUsers: false,
      canManageRoles: false,
      isSystem: true,
    },
  })

  // Créer le superadmin
  const hashedPassword = await bcrypt.hash('superadmin123', 10)
  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: { roleId: superadminRole.id },
    create: {
      username: 'superadmin',
      email: 'superadmin@a4l.com',
      password: hashedPassword,
      roleId: superadminRole.id,
    },
  })

  // Créer un admin
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { roleId: adminRole.id },
    create: {
      username: 'admin',
      email: 'admin@a4l.com',
      password: adminPassword,
      roleId: adminRole.id,
    },
  })

  // Importer les véhicules depuis le JSON
  console.log('📦 Importation des véhicules...')
  const vehiclesPath = path.join(__dirname, 'data', 'vehicles.json')
  
  if (fs.existsSync(vehiclesPath)) {
    const vehiclesData = JSON.parse(fs.readFileSync(vehiclesPath, 'utf8'))
    
    // Créer un Map pour stocker les marques (évite les doublons)
    const brandsMap = new Map()
    
    // Créer toutes les marques d'abord
    for (const vehicle of vehiclesData) {
      if (vehicle.brand && !brandsMap.has(vehicle.brand)) {
        const brandId = await makeUniqueId(
          vehicle.brand,
          async (candidate) => {
            const existing = await prisma.brand.findUnique({ where: { id: candidate } })
            return !!existing
          },
          'brand'
        )
        const brand = await prisma.brand.upsert({
          where: { name: vehicle.brand },
          update: {},
          create: {
            id: brandId,
            name: vehicle.brand,
          },
        })
        brandsMap.set(vehicle.brand, brand.id)
      }
    }
    
    console.log(`✅ ${brandsMap.size} marques créées`)
    
    // Créer tous les véhicules
    let created = 0
    let updated = 0
    
    for (const vehicle of vehiclesData) {
      if (!vehicle.brand || !vehicle.name) {
        console.warn(`⚠️  Véhicule ignoré (marque ou nom manquant):`, vehicle)
        continue
      }
      
      const brandId = brandsMap.get(vehicle.brand)
      if (!brandId) {
        console.warn(`⚠️  Marque non trouvée pour: ${vehicle.name}`)
        continue
      }
      
      try {
        // Vérifier si le véhicule existe déjà
        const existing = await prisma.vehicle.findFirst({
          where: {
            name: vehicle.name,
            brandId: brandId,
          },
        })
        
        if (existing) {
          // Mettre à jour
          await prisma.vehicle.update({
            where: { id: existing.id },
            data: {
              price: vehicle.price,
              power: vehicle.power || null,
              trunk: vehicle.trunk || null,
              vmax: vehicle.vmax || null,
              seats: vehicle.seats || null,
              category: vehicle.category || null,
              description: vehicle.description || null,
              images: vehicle.images || '',
            },
          })
          updated++
        } else {
          const vehicleId = await makeUniqueId(
            `${vehicle.brand}-${vehicle.name}`,
            async (candidate) => {
              const existingById = await prisma.vehicle.findUnique({ where: { id: candidate } })
              return !!existingById
            },
            'vehicle'
          )
          // Créer
          await prisma.vehicle.create({
            data: {
              id: vehicleId,
              name: vehicle.name,
              price: vehicle.price,
              power: vehicle.power || null,
              trunk: vehicle.trunk || null,
              vmax: vehicle.vmax || null,
              seats: vehicle.seats || null,
              category: vehicle.category || null,
              description: vehicle.description || null,
              images: vehicle.images || '',
              brandId: brandId,
            },
          })
          created++
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${vehicle.name}:`, error.message)
      }
    }
    
    console.log(`✅ ${created} véhicules créés, ${updated} véhicules mis à jour`)
  } else {
    console.warn('⚠️  Fichier vehicles.json non trouvé, pas d\'import de véhicules')
  }

  console.log('✅ Seed terminé!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

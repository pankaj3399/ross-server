/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. Create crc_categories table
  pgm.createTable('crc_categories', {
    id: 'id', // SERIAL PRIMARY KEY
    name: { type: 'varchar(100)', notNull: true, unique: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // 2. Seed initial categories
  const categories = [
    'AI Data Management',
    'AI Development Lifecycle',
    'AI Fairness & Non-Discrimination',
    'AI Governance & Strategy',
    'AI Operations & Monitoring',
    'AI Risk Management',
    'AI Transparency & Explainability',
    'AI Verification & Validation'
  ];
  categories.forEach(cat => {
    pgm.db.query('INSERT INTO crc_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [cat]);
  });

  // 3. Add new columns to crc_controls
  pgm.addColumns('crc_controls', {
    category_id: {
      type: 'integer',
      references: '"crc_categories"',
      onDelete: 'SET NULL',
    },
    expected_timeline: { type: 'text' },
  });
  pgm.addIndex('crc_controls', 'category_id', { name: 'idx_crc_controls_category_id' });

  // 4. Migrate data: timeline from implementation JSONB to expected_timeline column
  pgm.sql(`
    UPDATE crc_controls 
    SET expected_timeline = implementation->>'timeline'
    WHERE implementation ? 'timeline'
  `);

  // 5. Migrate data: category name to category_id
  pgm.sql(`
    UPDATE crc_controls c
    SET category_id = cat.id
    FROM crc_categories cat
    WHERE TRIM(LOWER(c.category)) = TRIM(LOWER(cat.name))
  `);

  // 6. Drop the old category column
  pgm.dropColumn('crc_controls', 'category');
};

exports.down = (pgm) => {
  // 1. Add back the category column
  pgm.addColumn('crc_controls', {
    category: { type: 'varchar(100)' }
  });

  // 2. Restore category names from the categories table
  pgm.sql(`
    UPDATE crc_controls c
    SET category = cat.name
    FROM crc_categories cat
    WHERE c.category_id = cat.id
  `);

  // 2.5 Ensure category is not NULL before altering
  pgm.sql("UPDATE crc_controls SET category = 'Uncategorized' WHERE category IS NULL");

  // 3. Make category NOT NULL if it was originally
  pgm.alterColumn('crc_controls', 'category', { notNull: true });

  // 4. Update implementation JSONB with timeline from expected_timeline column
  pgm.sql(`
    UPDATE crc_controls
    SET implementation = jsonb_set(implementation, '{timeline}', to_jsonb(expected_timeline))
    WHERE expected_timeline IS NOT NULL
  `);

  // 5. Drop the new columns and index
  pgm.dropIndex('crc_controls', 'category_id', { name: 'idx_crc_controls_category_id' });
  pgm.dropColumns('crc_controls', ['category_id', 'expected_timeline']);

  // 6. Drop Categories table
  pgm.dropTable('crc_categories');
};

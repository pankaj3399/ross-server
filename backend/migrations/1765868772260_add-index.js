
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createIndex('projects', 'version_id', {
    name: 'idx_projects_version_id',
    ifNotExists: true
  });

  pgm.createIndex('aima_practices', 'domain_id', {
    name: 'idx_aima_practices_domain_id',
    ifNotExists: true
  });

  pgm.createIndex('aima_domains', 'version_id', {
    name: 'idx_aima_domains_version_id',
    ifNotExists: true
  });

  pgm.createIndex('aima_practices', 'version_id', {
    name: 'idx_aima_practices_version_id',
    ifNotExists: true
  });

  pgm.createIndex('aima_questions', 'version_id', {
    name: 'idx_aima_questions_version_id',
    ifNotExists: true
  });

  pgm.createIndex('versions', 'created_at', {
    name: 'idx_versions_created_at',
    ifNotExists: true
  });
};

export const down = (pgm) => {
  pgm.dropIndex('versions', 'idx_versions_created_at', { ifExists: true });
  pgm.dropIndex('aima_questions', 'idx_aima_questions_version_id', { ifExists: true });
  pgm.dropIndex('aima_practices', 'idx_aima_practices_version_id', { ifExists: true });
  pgm.dropIndex('aima_domains', 'idx_aima_domains_version_id', { ifExists: true });
  pgm.dropIndex('aima_practices', 'idx_aima_practices_domain_id', { ifExists: true });
  pgm.dropIndex('projects', 'idx_projects_version_id', { ifExists: true });
};

/**
 * Calculates a structured diff between an existing visit record and incoming update fields.
 * Returns an array of changes: [{ field: string, from: string, to: string }]
 */
export function calculateVisitDiff(current, updateData) {
  const changes = [];

  const fieldDefinitions = [
    { key: 'school_name', label: 'School Name' },
    { key: 'district', label: 'District' },
    { key: 'cluster_or_block', label: 'Cluster / Taluk' },
    { key: 'institution_type', label: 'Institution Type' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'phone', label: 'Phone' },
    { key: 'student_strength', label: 'Student Strength' },
    { key: 'interest_level', label: 'Interest Level' },
    { key: 'outcome_status', label: 'Outcome Status' },
    { key: 'follow_up_date', label: 'Follow-up Date' },
    { key: 'product_specifications', label: 'Product Specifications' },
    { key: 'notes', label: 'Notes' }
  ];

  // Scalar field diffs
  for (const def of fieldDefinitions) {
    if (updateData[def.key] !== undefined) {
      const currentVal = current[def.key] !== null && current[def.key] !== undefined ? String(current[def.key]) : '';
      const newVal = updateData[def.key] !== null && updateData[def.key] !== undefined ? String(updateData[def.key]) : '';
      if (currentVal !== newVal) {
        changes.push({
          field: def.label,
          from: currentVal || 'None',
          to: newVal || 'None'
        });
      }
    }
  }

  // Product Interests diff
  if (updateData.product_interests !== undefined) {
    let oldInterests = [];
    try {
      oldInterests = typeof current.product_interests === 'string'
        ? JSON.parse(current.product_interests)
        : (current.product_interests || []);
    } catch (e) {
      oldInterests = [];
    }

    const newInterests = Array.isArray(updateData.product_interests) ? updateData.product_interests : [];
    const oldStr = [...oldInterests].sort().join(', ');
    const newStr = [...newInterests].sort().join(', ');

    if (oldStr !== newStr) {
      changes.push({
        field: 'Product Interests',
        from: oldStr || 'None',
        to: newStr || 'None'
      });
    }
  }

  // Attachments count diff
  if (updateData.attachments !== undefined) {
    let oldAtt = [];
    try {
      oldAtt = typeof current.attachments === 'string'
        ? JSON.parse(current.attachments)
        : (current.attachments || []);
    } catch (e) {
      oldAtt = [];
    }
    const newAtt = Array.isArray(updateData.attachments) ? updateData.attachments : [];
    if (oldAtt.length !== newAtt.length) {
      changes.push({
        field: 'Attachments',
        from: `${oldAtt.length} photo(s)`,
        to: `${newAtt.length} photo(s)`
      });
    }
  }

  return changes.length > 0
    ? changes
    : [{ field: 'Details Updated', from: 'Previous Record', to: 'Updated' }];
}

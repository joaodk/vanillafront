import type { FC } from "react";

interface Entity {
  id: string;
  name: string;
  type: string;
  attributes: Record<string, any>;
  parent_id: string | null;
}

interface Relationship {
  id: string;
  entity1_id: string;
  relationship: string;
  entity2_id: string;
  type: string;
  score: number;
  context: string;
  position: string;
}

interface SelectedEntityDetailsProps {
  entity: Entity | null;
  relationships: Relationship[];
  getEntityName: (id: string, entities: Entity[]) => string;
  entities: Entity[];
}

const SelectedEntityDetails: FC<SelectedEntityDetailsProps> = ({
  entity,
  relationships,
  getEntityName,
  entities,
}) => {
  if (!entity) {
    return (
      <div className="mt-2 p-2 rounded bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm">
        <p>No entity selected.</p>
      </div>
    );
  }

  // Filter relationships involving the selected entity
  const relatedRelationships = relationships.filter(
    (rel) => rel.entity1_id === entity.id || rel.entity2_id === entity.id
  );

  return (
      <div className="mt-2 p-2 rounded bg-white dark:bg-gray-900">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
        Details for: {entity.name}
      </h3>
      {relatedRelationships.length === 0 ? (
        <p className="text-sm text-gray-700 dark:text-gray-300">No relationships found.</p>
      ) : (
        <ul className="space-y-1 max-h-32 overflow-auto">
          {relatedRelationships.map((rel) => {
            const isEntity1 = rel.entity1_id === entity.id;
            const otherEntityId = isEntity1 ? rel.entity2_id : rel.entity1_id;
            const otherEntityName = getEntityName(otherEntityId, entities);
            const relationText = isEntity1
              ? `${rel.relationship} → ${otherEntityName}`
              : `${otherEntityName} → ${rel.relationship}`;

            return (
              <li
                key={rel.id}
                className="p-2 bg-gray-50 dark:bg-gray-800 rounded"
              >
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-medium">{relationText}</span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{rel.context}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SelectedEntityDetails;

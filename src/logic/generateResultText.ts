import { IMAGE_TEMPLATES, CONCEPT_TEMPLATES } from '../data/resultTemplates';

export function generateResultText(
  name: string,
  imageTags: string[],
  topMood: string,
  middleMood: string,
  baseMood: string,
  topNotesStr: string,
  middleNotesStr: string,
  baseNotesStr: string,
  rand: () => number
) {
  // Select templates deterministically using the seed random generator
  const imgIdx = Math.floor(rand() * IMAGE_TEMPLATES.length);
  const conceptIdx = Math.floor(rand() * CONCEPT_TEMPLATES.length);

  const imgTpl = IMAGE_TEMPLATES[imgIdx];
  const conceptTpl = CONCEPT_TEMPLATES[conceptIdx];

  const tag1 = imageTags[0] || '맑은';
  const tag2 = imageTags[1] || '세련된';

  const description = imgTpl
    .replace(/{name}/g, name)
    .replace(/{tag1}/g, tag1)
    .replace(/{tag2}/g, tag2);

  const concept = conceptTpl
    .replace(/{name}/g, name)
    .replace(/{topMood}/g, topMood)
    .replace(/{middleMood}/g, middleMood)
    .replace(/{baseMood}/g, baseMood);

  // Generate the paragraph explaining the recipe composition
  const recipeDesc = `이 이름은 ${tag1} 인상이 느껴져, 첫 향은 ${topNotesStr} 계열로 산뜻하게 열리도록 조향했습니다. 중심에는 ${middleNotesStr} 향조를 조화롭게 배치하였으며, 마지막은 ${baseNotesStr} 잔향으로 포근하고 안정감 있게 마무리되도록 구성했습니다.`;

  return {
    description,
    concept,
    recipeDesc
  };
}

from pathlib import Path
import xml.etree.ElementTree as ET
import hashlib,json
p=Path(__file__).parent
r=ET.parse(p/'deepseek_official_original.svg').getroot()
whale=list(r)[-1]
assert whale.tag.endswith('path') and whale.attrib['fill']=='#4D6BFE'
out=ET.Element('{http://www.w3.org/2000/svg}svg',{'width':'60','height':'41.3594','viewBox':'0 0 60 41.3594'})
out.append(whale)
ET.register_namespace('','http://www.w3.org/2000/svg')
ET.ElementTree(out).write(p/'deepseek_official_whale.svg',encoding='utf-8',xml_declaration=True)
(p/'original_whale.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="100" height="68" viewBox="0 0 100 68"><path fill="#103449" d="M12 35C12 19 28 12 44 17C58 21 64 32 73 34C79 29 77 18 83 15C83 26 89 28 94 27C94 36 85 43 77 43C69 56 44 61 27 51C18 46 12 42 12 35Z"/><path fill="#17B8D3" d="M29 46C43 52 59 49 69 41C56 43 45 39 39 32C39 41 35 45 29 46Z"/><circle cx="25" cy="31" r="2.5" fill="#E5F5F1"/></svg>''',encoding='utf-8')
manifest={'source_url':'https://github.com/deepseek-ai/DeepSeek-LLM/blob/main/images/logo.svg','original_sha256':hashlib.sha256((p/'deepseek_official_original.svg').read_bytes()).hexdigest(),'whale_extraction':'Last root-level path copied verbatim; wordmark omitted. Original path data and fill #4D6BFE retained. viewBox 0 0 60 41.3594. No nonuniform scale, warp, rotation, recolor or ornament added to official path.','guidelines_url':'https://github.com/deepseek-ai/awesome-deepseek-integration/blob/main/docs/_logo%20svg/guidelines.md','public_release_note':'The supplied guidelines condition brand asset use on actual model/API integration. Independent fan MV is not expressly covered. Official-logo compositions are review candidates pending usage clearance. Original-whale variants are the alternative. No official production or endorsement claimed.','original_whale':'Original geometric swim-whale artwork created for this project, distinct from DeepSeek official path.'}
(p/'logo_provenance.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')

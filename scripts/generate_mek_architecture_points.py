
import json, re, html, hashlib
from pathlib import Path
from urllib.request import urlopen, Request
repo=Path(r'C:/Users/Tamas/Documents/digital-neprajzi-atlasz'); data_dir=repo/'src'/'data'
source_id='magyar-neprajz-iv-anyagi-kultura-epiteszet-mek'; base='https://mek.oszk.hu/02100/02152/html/04/'
pages=['45.html','83.html','149.html','156.html','181.html']
REGIONS={
 'palocfold': {'name':'Palócföld','terms':['Palócföld','palócföld','palóc','palócok','palócvidék','palóc vidéken','palóc néprajzi'],'base':[48.05,19.75]},
 'sarkoz': {'name':'Sárköz','terms':['Sárköz','sárköz','sárközi'],'base':[46.35,18.75]},
 'kalotaszeg': {'name':'Kalotaszeg','terms':['Kalotaszeg','kalotaszeg','kalotaszegi'],'base':[46.85,23.05]},
}
ARCH_KEEP=['fal','falaz','vertfal','rovásos','zsilipelt','kő','borona','nádfal','ház','lakóház','otthon','pitvar','kamra','istáll','alaprajz','kúria','tető','szalmafed','széldeszka','orom','kapu','utcaajtó','födeleskapu','nagykapu','dísz','farag','ornamentika','csipkézés','motívum','tájház','múzeum','emlék','falumúzeum','porta','udvar','épület','építmény','harangláb','fatemplom']
SKIP_TOPICS=['fény','mécs','világítás','tálalás','lóca','pad','szék','kemence végében lévő tűzlóca']

def fetch(url):
 req=Request(url,headers={'User-Agent':'Hermes Atlasz Pilot/0.1'}); return urlopen(req,timeout=30).read().decode('iso-8859-2',errors='replace')
def strip_tags(s):
 s=re.sub(r'<script.*?</script>|<style.*?</style>',' ',s,flags=re.S|re.I); s=re.sub(r'<[^>]+>',' ',s); s=html.unescape(s); return re.sub(r'\s+',' ',s).strip()
def title(raw):
 m=re.search(r'<title>(.*?)</title>',raw,flags=re.S|re.I); return strip_tags(m.group(1)) if m else ''
def split_sentences(text): return [p.strip() for p in re.split(r'(?<=[.!?])\s+(?=[A-ZÁÉÍÓÖŐÚÜŰ0-9])',text) if 80<=len(p.strip())<=800]
def infer_fields(q):
 ql=q.lower(); fields=[]
 pairs=[(['fal','falaz','vertfal','rovásos','zsilipelt','kő','boronafal','nádfal'],['wall_material','wall_structure']),(['ház','lakóház','otthon','pitvar','kamra','istálló','alaprajz','kúria'],['house_layout']),(['tető','szalmafed','széldeszka','orom'],['roof_form','decorative_features']),(['kapu','utcaajtó','födeleskapu','nagykapu','porta'],['fence_gate','decorative_features','local_terms']),(['dísz','farag','ornamentika','csipkézés','motívum'],['characteristic_decoration','decorative_features']),(['tájház','múzeum','emlék','védelem','falumúzeum','harangláb','fatemplom'],['heritage_site'])]
 for keys, vals in pairs:
  if any(k in ql for k in keys):
   for v in vals:
    if v not in fields: fields.append(v)
 return fields or ['source_mention']
def topic(fields):
 if 'house_layout' in fields: return 'ház / alaprajz / helyiségek'
 if 'fence_gate' in fields: return 'kapu / kerítés / porta'
 if 'characteristic_decoration' in fields or 'decorative_features' in fields: return 'díszítés / forma'
 if 'wall_structure' in fields: return 'falazat / szerkezet'
 if 'roof_form' in fields: return 'tető / oromzat'
 if 'heritage_site' in fields: return 'építészeti emlék / tájház'
 return 'forrásemlítés'
def ext_id(region,page,idx,quote): return f'extract-mek-{region}-architecture-source-mention-{page[:-5]}-{idx:03d}-{hashlib.sha1(quote.encode()).hexdigest()[:8]}'
def coord(rid, idx):
 lat,lng=REGIONS[rid]['base']; offsets=[(-.10,-.10),(-.10,0),(-.10,.10),(0,-.14),(0,0),(0,.14),(.10,-.10),(.10,0),(.10,.10),(-.17,.05),(.17,-.05),(.14,.14)]
 dy,dx=offsets[idx%12]; row=idx//12; return round(lat+dy+row*.035,5), round(lng+dx-row*.035,5)
# Load and remove previous auto batch entries/points/reviews
ex=json.loads((data_dir/'extractions.json').read_text(encoding='utf-8'))
ex['extractions']=[e for e in ex['extractions'] if 'architecture-source-mention' not in e.get('id','')]
review=json.loads((data_dir/'review-items.json').read_text(encoding='utf-8'))
review['review_items']=[r for r in review['review_items'] if 'architecture-source-mention' not in r.get('id','')]

cands=[]
for page in pages:
 raw=fetch(base+page); text=strip_tags(raw); section=title(raw).split('/')[-1].strip()
 for sent in split_sentences(text):
  ql=sent.lower()
  if not any(k in ql for k in ARCH_KEEP): continue
  if any(k in ql for k in SKIP_TOPICS): continue
  for rid,meta in REGIONS.items():
   if any(t.lower() in ql for t in meta['terms']):
    if ('rovásos fal' in ql and rid=='palocfold') or ('a palóc család otthonáról' in ql) or ('nádfal' in ql and rid=='sarkoz') or ('födeleskapu' in ql and rid=='kalotaszeg') or ('boronafal' in ql and rid=='kalotaszeg'):
     continue
    cands.append((rid,page,section,sent)); break
seen=set(); kept=[]; per={r:0 for r in REGIONS}
for rid,page,section,sent in cands:
 norm=re.sub(r'\W+',' ',sent.lower())[:260]
 if norm in seen: continue
 seen.add(norm)
 if per[rid]>=16: continue
 per[rid]+=1; kept.append((rid,page,section,sent))
new_ext=[]; new_rev=[]; points=[]; point_idx={r:0 for r in REGIONS}
curated=[e for e in ex['extractions'] if e.get('source_id')==source_id and e.get('region_candidates')]
for e in curated:
 rid=e['region_candidates'][0]
 if rid not in REGIONS: continue
 point_idx[rid]+=1; lat,lng=coord(rid,point_idx[rid]); fields=e.get('field_candidates') or []
 points.append({'id':'point-'+e['id'].replace('extract-',''),'point_type':'source_claim','region_id':rid,'layer':'architecture','field_candidates':fields,'label':topic(fields)+' — '+REGIONS[rid]['name'],'coordinates':{'lat':lat,'lng':lng,'precision':'region_centroid_offset_for_display','coordinate_note':'Nem pontos helyszín; a tájegység köré széthúzott review-pont.'},'source_extraction_id':e['id'],'verification_status':'approved' if e.get('status')=='approved' else 'candidate_for_atlas','display_priority':10})
for idx,(rid,page,section,sent) in enumerate(kept,1):
 fields=infer_fields(sent); eid=ext_id(rid,page,idx,sent)
 new_ext.append({'id':eid,'source_id':source_id,'region_candidates':[rid],'region_specificity':'explicit_region' if rid in ['sarkoz','kalotaszeg'] or 'Palócföld' in sent else 'possible_region','layer_candidates':['architecture'],'field_candidates':fields,'source_locator':{'url':base+page,'section':section},'quote':sent,'paraphrase':f'A forrásrészlet {REGIONS[rid]["name"]} említést tartalmaz az építészet témakörében; pontos atlaszmező és értelmezés review után.','proposed_value':{'source_mention':sent,'topic':topic(fields)},'confidence':'medium' if rid in ['sarkoz','kalotaszeg'] or 'Palócföld' in sent else 'low','needs_review':True,'status':'candidate_for_map_review'})
 new_rev.append({'id':'review-'+eid.replace('extract-',''),'question':f'Releváns térképes candidate pont legyen-e ez a {REGIONS[rid]["name"]} / architecture layerhez?','evidence_extraction_id':eid,'recommended_decision':'triage_for_atlas_or_keep_as_context','notes':['Automatikus MEK Magyar Néprajz IV. Építészet batchből; nem végleges atlasz-adat, hanem térképes review-pont.']})
 point_idx[rid]+=1; lat,lng=coord(rid,point_idx[rid])
 points.append({'id':'point-'+eid.replace('extract-',''),'point_type':'source_claim_candidate','region_id':rid,'layer':'architecture','field_candidates':fields,'label':topic(fields)+' — '+REGIONS[rid]['name'],'coordinates':{'lat':lat,'lng':lng,'precision':'region_centroid_offset_for_display','coordinate_note':'Nem pontos helyszín; a tájegység köré széthúzott review-pont.'},'source_extraction_id':eid,'verification_status':'candidate_for_map_review','display_priority':40})
ex['extractions'].extend(new_ext); review['review_items'].extend(new_rev)
(data_dir/'extractions.json').write_text(json.dumps(ex,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(data_dir/'review-items.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(data_dir/'map-points.json').write_text(json.dumps({'schema_version':'0.1.0','description':'Térképre helyezett, review-zandó forráspontok. A region_centroid_offset_for_display koordináták vizuális széthúzást jelentenek, nem precíz terepi lokációt.','map_points':points},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('new',len(new_ext),'points',len(points),'per',point_idx)

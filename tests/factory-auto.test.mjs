import test from 'node:test';
import assert from 'node:assert/strict';
import {key,validate,approved,stepsText} from '../scripts/factory-core.mjs';
const draft=()=>({dish:'두부 볶음',title:'두부 볶음',time_min:20,servings:2,level:'쉬움',ingredients:['두부 1모','간장 1큰술'],steps:['1) 두부를 준비합니다.','2. 충분히 익힙니다.'],tip:'간을 확인하세요.'});
test('one blank line between numbered steps',()=>assert.equal(stepsText(validate(draft()).steps),'1) 두부를 준비합니다.\n\n2) 충분히 익힙니다.'));
test('normalized duplicate key',()=>assert.equal(key('두부 볶음!'),key('두부볶음')));
test('reject malformed ingredients, missing steps and invalid cooking time',()=>{for(const patch of [{ingredients:[]},{steps:['한 단계']},{time_min:0},{servings:-1},{ingredients:['두부',{}]}])assert.throws(()=>validate({...draft(),...patch}));});
test('AI gate requires explicit booleans; uncertain/mismatched photos cannot publish',()=>{const ok={recipe_ok:true,photo_matches:true,duplicate:false,unsafe:false};assert.equal(approved(ok),true);for(const patch of [{photo_matches:false},{duplicate:true},{unsafe:true},{recipe_ok:'true'},{unsafe:undefined}])assert.equal(approved({...ok,...patch}),false);assert.equal(approved(null),false);});

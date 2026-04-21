import { Router } from 'express';
import { loginHandler, authMiddleware, clientAuthMiddleware } from './auth';
import { runIntentHandler } from './client';
import {
  listLLMConfigs, createLLMConfig, updateLLMConfig, deleteLLMConfig,
  toggleLLMEnable, setDefaultLLM, testLLMConfig,
  listSkills, createSkill, updateSkill, deleteSkill,
  toggleSkillEnable, getSkillVersions, rollbackSkill, testSkill,
  listOperationLogs, listLLMCallLogs,
} from './admin';

const router = Router();

// ===== Client endpoints =====
router.post('/v1/run-intent', clientAuthMiddleware, runIntentHandler);

// ===== Admin login (no auth required) =====
router.post('/admin/login', loginHandler);

// ===== Admin endpoints (auth required) =====

// LLM Config
router.get('/admin/llm', authMiddleware, listLLMConfigs);
router.post('/admin/llm', authMiddleware, createLLMConfig);
router.put('/admin/llm/:id', authMiddleware, updateLLMConfig);
router.delete('/admin/llm/:id', authMiddleware, deleteLLMConfig);
router.patch('/admin/llm/:id/enable', authMiddleware, toggleLLMEnable);
router.patch('/admin/llm/:id/default', authMiddleware, setDefaultLLM);
router.post('/admin/llm/:id/test', authMiddleware, testLLMConfig);

// Skill Management
router.get('/admin/skill', authMiddleware, listSkills);
router.post('/admin/skill', authMiddleware, createSkill);
router.put('/admin/skill/:id', authMiddleware, updateSkill);
router.delete('/admin/skill/:id', authMiddleware, deleteSkill);
router.patch('/admin/skill/:id/enable', authMiddleware, toggleSkillEnable);
router.get('/admin/skill/versions/:intent', authMiddleware, getSkillVersions);
router.post('/admin/skill/:id/rollback', authMiddleware, rollbackSkill);
router.post('/admin/skill/:id/test', authMiddleware, testSkill);

// Log Management
router.get('/admin/log/operation', authMiddleware, listOperationLogs);
router.get('/admin/log/llm', authMiddleware, listLLMCallLogs);

export default router;
# Graph Report - .  (2026-07-23)

## Corpus Check
- Large corpus: 1038 files · ~34,209,394 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1110 nodes · 2370 edges · 73 communities (68 shown, 5 thin omitted)
- Extraction: 70% EXTRACTED · 30% INFERRED · 0% AMBIGUOUS · INFERRED: 710 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 65|Community 65]]

## God Nodes (most connected - your core abstractions)
1. `toast()` - 145 edges
2. `saveHero()` - 65 edges
3. `bootApp()` - 46 edges
4. `renderHeroUI()` - 40 edges
5. `_completeQuestInner()` - 33 edges
6. `escHtml()` - 33 edges
7. `renderQuestList()` - 32 edges
8. `addXP()` - 29 edges
9. `executeBattleAttack()` - 25 edges
10. `_bbRender()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `adventureFocusQuest()` --calls--> `toast()`  [INFERRED]
  js/adventure_cycle.js → js/ui.js
- `showRaceLockedMessage()` --calls--> `toast()`  [INFERRED]
  js/character.js → js/ui.js
- `initDB()` --calls--> `showSkeleton()`  [INFERRED]
  js/db.js → js/events.js
- `openGoalModal()` --calls--> `openModal()`  [INFERRED]
  js/goals.js → js/ui.js
- `bootApp()` --calls--> `checkHabitReminders()`  [INFERRED]
  js/main.js → js/habits.js

## Import Cycles
- None detected.

## Communities (73 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (54): _COMBO_TIERS, _comboCount, _comboLastAt, registerCombo(), renderComboChip(), addDailyGoalXP(), getDailyGoal(), getDailyGoalToday() (+46 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (56): adventureFocusQuest(), _campaignData(), _campaignProgress(), _campaignWeekKey(), claimWeeklyCampaign(), getAdventureCycle(), getWeeklyCampaignBonus(), renderAdventureCycle() (+48 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (56): _BB_EXHAUST_HOURS, _BB_FALLBACK_MOVES, _bbApplyVariance(), _bbAttackKey(), _bbBattleLog, _bbBattleStats, _bbBossCounterAttack(), _bbBossDmg() (+48 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (51): getForgeQueueMax(), hasGoldUpgrade(), addInvItem(), consumeInvItem(), getInvCount(), grantLoot(), _initInventoryGSAP(), inventory (+43 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (44): ACHIEVEMENT_DEFS, ARMOR_DEFS, AVATAR_FRAMES, BOSS_DEFS, BOSS_ELEMENT_CHART, BOSS_NAMES, CLASS_SKILLS, COMPLETIONS (+36 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (41): animBossCards(), destroyPlasmaWaves(), calcQuestXP(), getQuestDifficulty(), renderHeatmap(), updateQuest(), calcReputationByTag(), getReputationBonus() (+33 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (35): animPageItems(), playLevelUpSound(), restoreTimerState(), rollD20(), saveTimerState(), updateSpellBadge(), ACH_CATS, castSpell() (+27 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (34): applySidebarTOD(), getDungeonTOD(), getTODBonus(), _SB_TOD_GRADIENTS, TOD_DEFS, _TOD_TINTS, updateDungeonClock(), cleanupGarden() (+26 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (33): rpcWithRetry(), checkStreakRewards(), loadInventory(), craftRune(), renderRunePanel(), renderRuneSanctum(), RUNE_DEFS, RUNE_SOCKET_COUNT (+25 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (27): bulkComplete(), bulkDelete(), checkDailySpecialQuest(), checkStreakDanger(), checkWeeklyRetro(), closeMobileAdd(), _dayOfYearSeed(), deleteTemplate() (+19 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (34): getPrestigeDoctrineBonus(), renderFamiliar(), addMana(), _applyBossDeadlinePenalty(), BOSS_CYCLE_HP, BOSS_CYCLE_ICONS, BOSS_CYCLE_LABELS, BOSS_CYCLE_RARITIES (+26 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (29): buySalaFurniture(), _debounceSave(), _getSala(), hasSalaBlueprint(), _normalizeSalaOwnership(), _perspScale(), renderSalaPersonal(), SALA_CATEGORIES (+21 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (10): _initBatch4(), _initBatch4b(), initCursorTrail(), initDockMagnify(), initMagicSpotlight(), initMagnetic(), initMeteors(), initSpotlightHero() (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (25): animCharTabIn(), animViewOut(), BESTIARY_RARITY_CLR, _bestiaryKnowledgeKey(), BOSS_LORE, getBestiary(), getBossKnowledge(), getBossLore() (+17 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (21): animModalOpen(), openCmdk(), openQuickCreate(), syncQuestHabitFields(), populateGoalSelect(), checkHabitReminders(), getHabitReminderTime(), isHabitNegative() (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (18): adoptSecretClass(), _charPreviewPortrait(), chooseInitialClass(), CLASS_LABELS, confirmHeroClassChange(), confirmInitialIdentity(), _initialIdentity, openInitialIdentitySelection() (+10 more)

### Community 16 - "Community 16"
Cohesion: 0.10
Nodes (19): animBootSequence(), checkConnection(), checkDailySummary(), checkDeadlineAlerts(), checkGoldNudge(), checkMorningReview(), checkOverdueHP(), initParticles() (+11 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (22): applyTemplate(), exportCSV(), submitMobileAdd(), submitMorningReview(), submitQuickCreate(), toggleAutoBreak(), toggleNightmareMode(), saveHabitReminder() (+14 more)

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (20): canLearnSkill(), chooseDoctrine(), CLASS_DOCTRINES, getAllSkillDefs(), getHeroDoctrine(), getHeroSkillTree(), getSkillMaxHP(), getSkillTreeGoldBonus() (+12 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (18): renderWorldMap(), _wmGetAP(), _wmOpenZone(), _wmSetAP(), wmSpendAP(), ZONE_MAP_POSITIONS, calcZoneXP(), checkZoneRandomQuest() (+10 more)

### Community 20 - "Community 20"
Cohesion: 0.21
Nodes (15): checkFactionExclusiveProgress(), claimFactionExclusive(), _factionCardEl(), _factionClaims(), _factionFocusKey(), _factionLatestClaim(), _factionRankIndex(), _factionXP() (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (12): _ANIM_VIEW_SELECTORS, animHPBar(), animManaBar(), animMobileSheetClose(), animMobileSheetOpen(), animXPBar(), assignAttrPoint(), saveConfigView() (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (17): activatePivot(), enterBulkMode(), initSwipeToComplete(), migrateRarity(), resetDailyQuests(), resetRepeatQuests(), setQuestDifficulty(), setTagFilter() (+9 more)

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (16): animToastIn(), betaFeedbackRow(), _bbMoveVisual(), _charSecretClassesHtml(), _chrArmorRowHtml(), _chrAttrCardHtml(), _chrEqRowHtml(), _chrPortraitBadgesHtml() (+8 more)

### Community 24 - "Community 24"
Cohesion: 0.24
Nodes (14): buildClassReset(), canPrestige(), choosePrestigeDoctrine(), _CLASS_XP, classXPBonus(), confirmPrestige(), doPrestige(), getPrestigeDoctrine() (+6 more)

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (13): alertsMigration, alertsScript, assert, backup, freeDrill, fs, localDrill, monitoring (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.40
Nodes (12): abandonChallenge(), CHALLENGE_DEFS, claimChallengeReward(), getActiveChallenges(), _getChallenges(), getCompletedChallenges(), openChallengesModal(), renderChallenges() (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.15
Nodes (12): assert, auth, beta, character, dbClient, economyMigration, fs, habits (+4 more)

### Community 28 - "Community 28"
Cohesion: 0.26
Nodes (6): doAuthSubmit(), doLogin(), doSignup(), _setAuthBtnLabel(), _setAuthBtnLoading(), toggleSignupMode()

### Community 29 - "Community 29"
Cohesion: 0.24
Nodes (10): animLevelUpModal(), spawnConfetti(), calcLevel(), _cardBar(), _cardRoundRect(), generateHeroCard(), xpForLevel(), showLevelUp() (+2 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, short_name, shortcuts (+2 more)

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (9): _buildMonthlyLocal(), _buildPatternsLocal(), checkMonthlyReport(), checkWeeklyPatternAnalysis(), generateMonthlyReport(), generatePatternAnalysis(), renderMonthlyReport(), renderPatterns() (+1 more)

### Community 32 - "Community 32"
Cohesion: 0.20
Nodes (9): assert, battle, character, classMigration, config, fs, hero, migration (+1 more)

### Community 33 - "Community 33"
Cohesion: 0.22
Nodes (8): breakDuration, bulkSelected, goals, pomGoal, pomodoros, quests, spellState, timer

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (7): assert, boss, checklist, fs, lock, rewards, store

### Community 35 - "Community 35"
Cohesion: 0.22
Nodes (8): assert, buyItem, fs, migration, sala, salaMigration, shop, weapons

### Community 36 - "Community 36"
Cohesion: 0.25
Nodes (6): assert, fs, index, path, root, sw

### Community 37 - "Community 37"
Cohesion: 0.38
Nodes (4): deleteGoal(), openGoalModal(), renderGoals(), saveGoal()

### Community 38 - "Community 38"
Cohesion: 0.29
Nodes (6): assert, fs, heroJs, migration, rpgJs, shopJs

### Community 39 - "Community 39"
Cohesion: 0.29
Nodes (6): assert, calls, context, db, fs, vm

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (6): assert, context, fs, initial, reset, vm

### Community 41 - "Community 41"
Cohesion: 0.29
Nodes (6): assert, dbJs, fs, migration, questsJs, uiJs

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (6): assert, clearIdx, fnBody, fs, insertIdx, zonesJs

### Community 43 - "Community 43"
Cohesion: 0.40
Nodes (4): DROP_CHANCES, DROP_ITEMS, _spawnChestOpen(), spawnLootDrop()

### Community 44 - "Community 44"
Cohesion: 0.53
Nodes (5): initPush(), isPushSubscribed(), subscribeToPush(), unsubscribeFromPush(), _urlB64ToUint8()

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (5): assert, authJs, fs, indexHtml, viewsJs

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (5): assert, battle, bossFix, fs, migration

### Community 47 - "Community 47"
Cohesion: 0.33
Nodes (5): assert, events, fs, html, quickModal

### Community 48 - "Community 48"
Cohesion: 0.33
Nodes (5): assert, events, factions, fs, migration

### Community 50 - "Community 50"
Cohesion: 0.60
Nodes (4): calcHeroScore(), getHeroScoreTier(), HERO_SCORE_TIERS, renderHeroScoreWidget()

### Community 51 - "Community 51"
Cohesion: 0.40
Nodes (4): assert, fs, hero, migration

### Community 52 - "Community 52"
Cohesion: 0.50
Nodes (3): assert, fs, runesJs

### Community 53 - "Community 53"
Cohesion: 0.50
Nodes (3): assert, fs, migration

### Community 54 - "Community 54"
Cohesion: 0.50
Nodes (3): assert, fs, views

### Community 55 - "Community 55"
Cohesion: 0.50
Nodes (3): assert, fs, migration

### Community 56 - "Community 56"
Cohesion: 0.50
Nodes (3): assert, fs, push

### Community 57 - "Community 57"
Cohesion: 0.50
Nodes (3): assert, fs, migration

### Community 58 - "Community 58"
Cohesion: 0.50
Nodes (3): assert, fs, migration

### Community 59 - "Community 59"
Cohesion: 0.50
Nodes (3): assert, db, fs

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (3): assert, fs, migration

## Knowledge Gaps
- **296 isolated node(s):** `sileo`, `deploy.sh script`, `WEEKLY_CAMPAIGN_ARCS`, `_ANIM_VIEW_SELECTORS`, `BESTIARY_RARITY_CLR` (+291 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `toast()` connect `Community 17` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 26`, `Community 29`, `Community 37`, `Community 44`, `Community 49`?**
  _High betweenness centrality (0.320) - this node is a cross-community bridge._
- **Why does `saveHero()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 13`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 26`, `Community 31`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `updateBossBanner()` connect `Community 5` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 10`, `Community 17`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 137 inferred relationships involving `toast()` (e.g. with `adventureFocusQuest()` and `claimWeeklyCampaign()`) actually correct?**
  _`toast()` has 137 INFERRED edges - model-reasoned connections that need verification._
- **Are the 58 inferred relationships involving `saveHero()` (e.g. with `claimWeeklyCampaign()` and `recordBossDefeat()`) actually correct?**
  _`saveHero()` has 58 INFERRED edges - model-reasoned connections that need verification._
- **Are the 44 inferred relationships involving `bootApp()` (e.g. with `animBootSequence()` and `updateChallengeProgress()`) actually correct?**
  _`bootApp()` has 44 INFERRED edges - model-reasoned connections that need verification._
- **Are the 36 inferred relationships involving `renderHeroUI()` (e.g. with `assignAttrPoint()` and `confirmHeroClassChange()`) actually correct?**
  _`renderHeroUI()` has 36 INFERRED edges - model-reasoned connections that need verification._
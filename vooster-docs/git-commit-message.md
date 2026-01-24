
# Git Commit Message Rules

## Branch Naming Convention

### Format
```
<type>/<short-description>
```

### Types

| Type | 설명 | 예시 |
|------|------|------|
| `feat` | 새 기능 | `feat/user-profile` |
| `fix` | 버그 수정 | `fix/upload-error` |
| `refactor` | 리팩토링 | `refactor/gallery-layout` |
| `perf` | 성능 개선 | `perf/image-loading` |
| `test` | 테스트 | `test/auth-e2e` |
| `docs` | 문서 | `docs/api-guide` |
| `chore` | 기타 작업 | `chore/dependencies` |
| `style` | 스타일 변경 | `style/button-hover` |

### Rules

- **소문자만 사용**: `feat/User-Profile` ❌ → `feat/user-profile` ✅
- **단어 구분**: 하이픈(`-`) 사용
- **최대 50자**: 간결하게 유지
- **영어 권장**: 한글 사용 시 인코딩 이슈 가능

### Examples

```bash
# Good
feat/oauth-google-login
fix/memory-leak-session
refactor/extract-validation-utils
perf/lazy-load-images

# Bad
feat/AddNewUserProfileFeature    # 너무 길고 대문자 사용
fix_upload_error                 # 언더스코어 사용
feature/login                    # 잘못된 type (feature → feat)
```

---

## Format Structure
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

## Types (Required)
- `feat`
- `fix`
- `docs`
- `style`
- `refactor`
- `perf`
- `test`
- `chore`
- `ci`
- `build`
- `revert`

## Scope (Optional)
- Component, file, or feature area affected
- Use kebab-case: `user-auth`, `payment-api`
- Omit if change affects multiple areas

## Description Rules
- Use imperative mood
- No capitalization of first letter
- No period at end
- Max 50 characters
- Be specific and actionable

## Body Guidelines
- Wrap at 72 characters
- Explain what and why, not how
- Separate from description with blank line
- Use bullet points for multiple changes

## Footer Format
- `BREAKING CHANGE:` for breaking changes
- `Closes #123` for issue references
- `Co-authored-by: Vooster AI (@vooster-ai)`

## Examples
```
feat(auth): add OAuth2 Google login

fix: resolve memory leak in user session cleanup

docs(api): update authentication endpoints

refactor(utils): extract validation helpers to separate module

BREAKING CHANGE: remove deprecated getUserData() method
```

## Workflow Integration
**ALWAYS write a commit message after completing any development task, feature, or bug fix.**

## Validation Checklist
- [ ] Type is from approved list
- [ ] Description under 50 chars
- [ ] Imperative mood used
- [ ] No trailing period
- [ ] Meaningful and clear context
    
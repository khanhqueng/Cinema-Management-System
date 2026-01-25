#!/bin/bash
echo "Fixing RegisterPage.tsx..."

# Remove everything after line 186 (where <style jsx> starts) and add proper closing
head -n 185 /Users/khanhpham/Code-Domain/cinema/frontend/src/pages/RegisterPage.tsx > /tmp/register-temp.tsx

# Add the closing at the end
cat >> /tmp/register-temp.tsx << 'REGISTER_END'
      </div>
    </div>
  );
};

export default RegisterPage;
REGISTER_END

# Add CSS modules import at the top
sed -i '' '4a\
import styles from '"'"'./Auth.module.css'"'"';
' /tmp/register-temp.tsx

# Replace all className references
sed -i '' 's/className="auth-page"/className={styles.authPage}/g' /tmp/register-temp.tsx
sed -i '' 's/className="auth-background"/className={styles.authBackground}/g' /tmp/register-temp.tsx
sed -i '' 's/className="auth-background-gradient"/className={styles.authBackgroundGradient}/g' /tmp/register-temp.tsx
sed -i '' 's/className="auth-container"/className={styles.authContainer}/g' /tmp/register-temp.tsx
sed -i '' 's/className="auth-form-wrapper"/className={styles.authFormWrapper}/g' /tmp/register-temp.tsx
sed -i '' 's/className="auth-header"/className={styles.authHeader}/g' /tmp/register-temp.tsx
sed -i '' 's/className="auth-form"/className={styles.authForm}/g' /tmp/register-temp.tsx
sed -i '' 's/className="alert alert-error"/className={`${styles.alert} ${styles.alertError}`}/g' /tmp/register-temp.tsx
sed -i '' 's/className="alert alert-success"/className={`${styles.alert} ${styles.alertSuccess}`}/g' /tmp/register-temp.tsx
sed -i '' 's/className="form-group"/className={styles.formGroup}/g' /tmp/register-temp.tsx
sed -i '' 's/className="form-input"/className={styles.formInput}/g' /tmp/register-temp.tsx
sed -i '' 's/className="password-input-wrapper"/className={styles.passwordInputWrapper}/g' /tmp/register-temp.tsx
sed -i '' 's/className="password-toggle"/className={styles.passwordToggle}/g' /tmp/register-temp.tsx
sed -i '' 's/className="helper-text"/className={styles.helperText}/g' /tmp/register-temp.tsx
sed -i '' 's/className="btn btn-primary btn-large btn-full"/className={`btn ${styles.btnPrimary} btn-large ${styles.btnFull}`}/g' /tmp/register-temp.tsx
sed -i '' 's/className="auth-footer"/className={styles.authFooter}/g' /tmp/register-temp.tsx
sed -i '' 's/className="auth-link"/className={styles.authLink}/g' /tmp/register-temp.tsx

# Move to final location
mv /tmp/register-temp.tsx /Users/khanhpham/Code-Domain/cinema/frontend/src/pages/RegisterPage.tsx

echo "RegisterPage.tsx fixed!"

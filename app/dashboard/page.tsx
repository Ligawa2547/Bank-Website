{/* Account Details Card */}
      {profile && (
        <AccountDetailsCard
          accountNumber={profile.account_no}
          accountName={`${profile.first_name} ${profile.last_name}`}
          balance={profile.balance}
        />
      )}